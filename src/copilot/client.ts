import { CopilotClient } from '@github/copilot-sdk';
import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class CopilotService {
  private client: CopilotClient | null = null;
  private octokit: Octokit;
  private isStarted = false;
  private repoInitialized = false;

  constructor() {
    this.octokit = new Octokit({
      auth: config.githubToken,
    });
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      logger.debug('Copilot client already started');
      return;
    }

    try {
      logger.info('Starting Copilot CLI client...');
      
      this.client = new CopilotClient();
      await this.client.start();
      
      this.isStarted = true;
      logger.info('Copilot CLI client started successfully');

      // Inicializar repositorio
      await this.initializeRepo();
    } catch (error) {
      logger.error('Failed to start Copilot client', { error });
      throw new Error('Could not start Copilot CLI. Is it installed?');
    }
  }

  private async initializeRepo(): Promise<void> {
    try {
      const repoPath = config.sicemRepoPath;
      const repoUrl = `https://github.com/${config.sicemRepoOwner}/${config.sicemRepoName}.git`;

      // Verificar si el directorio existe
      try {
        await fs.access(repoPath);
        logger.info('Repository directory exists, syncing with remote...');
        await this.syncRepoWithRemote();
      } catch {
        // Si no existe, clonar
        logger.info('Cloning repository...', { repoUrl, repoPath });
        
        // Crear directorio padre si no existe
        const parentDir = path.dirname(repoPath);
        await fs.mkdir(parentDir, { recursive: true });
        
        // Clonar el repositorio
        await execAsync(`git clone -b ${config.sicemRepoBranch} ${repoUrl} "${repoPath}"`);
      }

      // Configurar git con el token
      await execAsync(`git -C "${repoPath}" config credential.helper store`);
      
      this.repoInitialized = true;
      logger.info('Repository initialized successfully', { repoPath });
    } catch (error) {
      logger.error('Failed to initialize repository', { error });
      throw new Error('Could not initialize SICEM repository');
    }
  }

  private async syncRepoWithRemote(): Promise<void> {
    const repoPath = config.sicemRepoPath;
    const branch = config.sicemRepoBranch;

    logger.info('Syncing repository with fetch + reset', { repoPath, branch });
    console.log(`🔄 Sincronizando repo (${branch}) con fetch + reset...`);

    await execAsync(`git -C "${repoPath}" fetch origin ${branch} --prune`);
    await execAsync(`git -C "${repoPath}" checkout ${branch}`);
    await execAsync(`git -C "${repoPath}" reset --hard origin/${branch}`);
    await execAsync(`git -C "${repoPath}" clean -fd`);
  }

  async stop(): Promise<void> {
    if (this.client && this.isStarted) {
      logger.info('Stopping Copilot CLI client...');
      await this.client.stop();
      this.isStarted = false;
      logger.info('Copilot CLI client stopped');
    }
  }

  async createSession(options?: { streaming?: boolean }) {
    if (!this.client || !this.isStarted) {
      throw new Error('Copilot client not started');
    }

    logger.debug('Creating Copilot session', { options });

    const session = await this.client.createSession({
      model: config.copilotModel,
      streaming: options?.streaming ?? true,
      workingDirectory: config.sicemRepoPath,
      onPermissionRequest: async () => {
        logger.debug('Permission request from Copilot - auto-approving');
        return { kind: 'approved' as const };
      },
    });

    return session;
  }

  async executeRecipeWithAutoCommit(
    recipePrompt: string,
    commitMessage: string,
    onProgress?: (chunk: string) => void
  ): Promise<{ response: string; prUrl?: string }> {
    if (!this.repoInitialized) {
      throw new Error('Repository not initialized');
    }

    // Siempre iniciar desde el último estado remoto
    await this.syncRepoWithRemote();

    // Generar nombre de branch único
    const timestamp = Date.now();
    const branchName = `bot/${commitMessage.substring(0, 30).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${timestamp}`;

    logger.info('🌿 Creando nuevo branch', { branchName });
    console.log(`🌿 Creando branch: ${branchName}`);

    // Crear y cambiar a nuevo branch
    await execAsync(`git -C "${config.sicemRepoPath}" checkout -b ${branchName}`);

    // Agregar instrucción explícita de ejecución al prompt
    const enhancedPrompt = `${recipePrompt}

**MODO DE EJECUCIÓN: AUTOMÁTICO**

Debes ejecutar TODOS los cambios directamente en el repositorio ubicado en: ${config.sicemRepoPath}

- Crea los archivos necesarios
- Modifica los archivos existentes
- Genera migraciones SQL
- NO solo generes un plan, EJECUTA los cambios

Trabaja en el branch: ${branchName}
`;

    logger.info('🤖 Creando sesión de Copilot...');
    console.log('🤖 Creando sesión de Copilot con timeout extendido...');

    // Usar streaming para mantener la sesión activa
    const session = await this.createSession({ streaming: true });

    let fullResponse = '';

    // Listener para streaming que actualiza cada chunk
    session.on('assistant.message_delta', (event) => {
      if (event.data.deltaContent) {
        fullResponse += event.data.deltaContent;
        
        // Mostrar progreso en consola cada 100 caracteres
        if (fullResponse.length % 100 === 0) {
          console.log(`📝 Recibiendo respuesta... (${fullResponse.length} caracteres)`);
        }
        
        if (onProgress) {
          onProgress(event.data.deltaContent);
        }
      }
    });

    logger.info('📨 Enviando prompt a Copilot...');
    console.log('📨 Enviando prompt a Copilot...');
    console.log('⏳ Procesando (esto puede tardar varios minutos)...');
    console.log('💡 Tip: Mientras más complejo el request, más tiempo tomará\n');

    try {
      const response = await session.sendAndWait(
        { prompt: enhancedPrompt },
        300000 // 5 minutos
      );

      if (response?.data.content && !fullResponse) {
        fullResponse = response.data.content;
      }

      logger.info('✅ Copilot respondió', {
        responseLength: fullResponse.length,
      });
      console.log(`✅ Respuesta recibida (${fullResponse.length} caracteres)`);

    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        logger.error('❌ Timeout de Copilot - La tarea tomó más de 5 minutos');
        console.error('❌ Timeout: La tarea tomó más de 5 minutos');
        console.error('💡 Sugerencia: Divide la tarea en partes más pequeñas');
        
        // Limpiar branch
        await execAsync(`git -C "${config.sicemRepoPath}" checkout ${config.sicemRepoBranch}`);
        await execAsync(`git -C "${config.sicemRepoPath}" branch -D ${branchName}`);
        
        throw new Error('Timeout: La tarea tomó más de 5 minutos. Intenta dividir la solicitud en partes más pequeñas.');
      }
      throw error;
    }

    // Hacer commit y crear PR
    logger.info('💾 Verificando cambios...');
    console.log('💾 Verificando cambios para commit...');
    
    let prUrl: string | undefined;

    try {
      // Verificar si hay cambios
      const { stdout: status } = await execAsync(`git -C "${config.sicemRepoPath}" status --porcelain`);
      
      if (!status.trim()) {
        logger.info('ℹ️  No hay cambios para commit');
        console.log('ℹ️  No se detectaron cambios');
        
        // Volver al branch original
        await execAsync(`git -C "${config.sicemRepoPath}" checkout ${config.sicemRepoBranch}`);
        await execAsync(`git -C "${config.sicemRepoPath}" branch -D ${branchName}`);
        
        return { response: fullResponse };
      }

      // Hacer commit
      await execAsync(`git -C "${config.sicemRepoPath}" add .`);
      await execAsync(`git -C "${config.sicemRepoPath}" commit -m "${commitMessage}"`);
      
      logger.info('✅ Commit realizado');
      console.log('✅ Commit realizado');

      // Push del branch
      logger.info('⬆️  Pusheando branch...');
      console.log('⬆️  Subiendo branch a GitHub...');
      await execAsync(`git -C "${config.sicemRepoPath}" push -u origin ${branchName}`);
      
      logger.info('✅ Branch pusheado');
      console.log('✅ Branch subido a GitHub');

      // Crear Pull Request
      logger.info('🔀 Creando Pull Request...');
      console.log('🔀 Creando Pull Request...');

      const pr = await this.octokit.pulls.create({
        owner: config.sicemRepoOwner,
        repo: config.sicemRepoName,
        title: commitMessage,
        head: branchName,
        base: config.sicemRepoBranch,
        body: `## 🤖 Generado por Bot de Telegram

### Request del Usuario:
${commitMessage}

### Cambios Realizados:
${fullResponse.substring(0, 500)}...

---
_Este PR fue creado automáticamente por el bot de Telegram usando GitHub Copilot._
`,
      });

      prUrl = pr.data.html_url;
      
      logger.info('✅ Pull Request creado', { prUrl, prNumber: pr.data.number });
      console.log('✅ Pull Request creado:', prUrl);

      // Volver al branch original
      await execAsync(`git -C "${config.sicemRepoPath}" checkout ${config.sicemRepoBranch}`);

    } catch (error) {
      logger.error('❌ Error en commit/PR', { error });
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      
      // Intentar volver al branch original
      try {
        await execAsync(`git -C "${config.sicemRepoPath}" checkout ${config.sicemRepoBranch}`);
        await execAsync(`git -C "${config.sicemRepoPath}" branch -D ${branchName}`);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup branch', { cleanupError });
      }
      
      throw error;
    }

    return { response: fullResponse, prUrl };
  }

  async executeRecipe(
    recipePrompt: string,
    onProgress?: (chunk: string) => void
  ): Promise<string> {
    if (!this.repoInitialized) {
      throw new Error('Repository not initialized');
    }

    await this.syncRepoWithRemote();

    const session = await this.createSession({ streaming: !!onProgress });

    let fullResponse = '';

    if (onProgress) {
      session.on('assistant.message_delta', (event) => {
        if (event.data.deltaContent) {
          fullResponse += event.data.deltaContent;
          onProgress(event.data.deltaContent);
        }
      });
    }

    const response = await session.sendAndWait(
      { prompt: recipePrompt },
      300000 // 5 minutos
    );

    if (!onProgress && response?.data.content) {
      fullResponse = response.data.content;
    }

    logger.info('Recipe executed successfully', {
      responseLength: fullResponse.length,
    });

    return fullResponse;
  }

  private async commitChanges(message: string): Promise<void> {
    const repoPath = config.sicemRepoPath;

    try {
      // Verificar si hay cambios
      const { stdout: status } = await execAsync(`git -C "${repoPath}" status --porcelain`);
      
      if (!status.trim()) {
        logger.info('No changes to commit');
        return;
      }

      logger.info('Committing changes...', { message });

      // Add todos los cambios
      await execAsync(`git -C "${repoPath}" add .`);

      // Commit
      await execAsync(`git -C "${repoPath}" commit -m "${message}"`);

      // Push
      await execAsync(`git -C "${repoPath}" push origin ${config.sicemRepoBranch}`);

      logger.info('Changes committed and pushed successfully');
    } catch (error) {
      logger.error('Failed to commit changes', { error });
      throw error;
    }
  }

  async getChangedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git -C "${config.sicemRepoPath}" status --porcelain`);
      return stdout.trim().split('\n').filter(line => line.trim());
    } catch (error) {
      logger.error('Failed to get changed files', { error });
      return [];
    }
  }

  isReady(): boolean {
    return this.isStarted && this.client !== null && this.repoInitialized;
  }
}

// Singleton instance
export const copilotService = new CopilotService();
