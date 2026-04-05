import { Context, SessionFlavor } from 'grammy';
import { logger } from '../../utils/logger.js';
import { copilotService } from '../../copilot/client.js';
import { loadRecipe, personalizeRecipe } from '../../recipes/loader.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

export async function crearHandler(ctx: MyContext) {
  logger.info('Command /crear invoked', { userId: ctx.from?.id });

  await ctx.reply(
    '🤖 **Crear Módulo CRUD Completo**\n\n' +
    'Cuéntame qué módulo quieres crear. Incluye:\n\n' +
    '✅ Nombre del módulo (ej: Proveedores)\n' +
    '✅ Campos que necesita\n' +
    '✅ Relaciones con otras tablas (opcional)\n' +
    '✅ Reglas de negocio especiales (opcional)\n\n' +
    '**Ejemplo:**\n' +
    '_"Crear módulo Proveedores con campos: nombre comercial, RFC, email, teléfono"_'
  );

  // Esperar la siguiente respuesta del usuario
  ctx.session.waitingFor = 'crear-input';
}

export async function handleCrearInput(ctx: MyContext, userInput: string) {
  const chatId = ctx.chat?.id;
  
  if (!chatId) {
    await ctx.reply('❌ Error: No se pudo identificar el chat');
    return;
  }

  // Responder inmediatamente para evitar timeout de Telegram
  await ctx.reply('⏳ Procesando tu solicitud...\n\nEsto puede tardar 1-2 minutos. Te notificaré cuando esté listo.');

  // Procesar en background
  processCrearInBackground(ctx, userInput, chatId).catch(error => {
    logger.error('Fatal error in background processing', { error });
  });
}

async function processCrearInBackground(
  ctx: MyContext,
  userInput: string,
  chatId: number
) {
  try {
    logger.info('🔄 INICIANDO: Creación de módulo CRUD', { userInput });
    console.log('\n🔄 Cargando receta de crear CRUD completo...');

    const recipeTemplate = await loadRecipe('crear-crud-completo');
    logger.info('✅ Receta cargada', { size: recipeTemplate.length });
    console.log('✅ Receta cargada exitosamente');

    logger.info('🔄 PERSONALIZANDO: Prompt con input del usuario');
    console.log('🔄 Personalizando receta...');
    const personalizedPrompt = personalizeRecipe(recipeTemplate, userInput);
    console.log('✅ Receta personalizada');

    logger.info('🔄 EJECUTANDO: Copilot con auto-commit');
    console.log('\n🤖 Ejecutando Copilot...');
    console.log('📝 Request:', userInput);

    const commitMessage = `feat: Crear módulo ${userInput.substring(0, 40)}`;
    
    console.log('⏳ Esperando respuesta de Copilot (esto puede tardar 1-2 min)...');
    const { response: result, prUrl } = await copilotService.executeRecipeWithAutoCommit(
      personalizedPrompt,
      commitMessage
    );

    logger.info('✅ COMPLETADO: Copilot ejecutó exitosamente', { 
      responseLength: result.length,
      prUrl 
    });
    console.log('✅ Copilot completó la ejecución');

    logger.info('🔄 VERIFICANDO: Archivos modificados');
    console.log('🔍 Verificando cambios en git...');
    const changedFiles = await copilotService.getChangedFiles();
    
    if (changedFiles.length > 0) {
      console.log(`📁 ${changedFiles.length} archivo(s) creado(s)/modificado(s):`);
      changedFiles.forEach(file => console.log(`   • ${file}`));
    } else {
      console.log('ℹ️  No se detectaron cambios en git');
    }

    logger.info('📤 ENVIANDO: Resultado a Telegram');
    console.log('\n📤 Enviando resultado a Telegram...');

    const maxLength = 4000;
    if (result.length > maxLength) {
      const chunks = splitMessage(result, maxLength);
      await ctx.api.sendMessage(chatId, '✅ **¡Módulo creado exitosamente!**\n\n');
      for (const chunk of chunks) {
        await ctx.api.sendMessage(chatId, chunk);
      }
    } else {
      await ctx.api.sendMessage(
        chatId,
        '✅ **¡Módulo creado exitosamente!**\n\n' + result
      );
    }

    // Mostrar PR y archivos
    let finalMessage = '';
    
    if (prUrl) {
      finalMessage += `🔀 **Pull Request creado:**\n${prUrl}\n\n`;
    }

    if (changedFiles.length > 0) {
      finalMessage += '📁 **Archivos creados/modificados:**\n' +
        changedFiles.slice(0, 10).map(f => `• ${f}`).join('\n') +
        (changedFiles.length > 10 ? `\n...y ${changedFiles.length - 10} más` : '');
    }

    if (finalMessage) {
      await ctx.api.sendMessage(chatId, finalMessage);
    }

    logger.info('✅ FINALIZADO: Módulo creado exitosamente', {
      userId: ctx.from?.id,
      userInput,
      filesChanged: changedFiles.length,
      prUrl,
    });
    console.log('✅ Proceso finalizado exitosamente\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('❌ ERROR: Fallo en la creación del módulo', { 
      error: errorMessage,
      stack: errorStack,
      userInput 
    });
    console.error('❌ Error:', errorMessage);
    if (errorStack) {
      console.error('Stack:', errorStack);
    }
    
    await ctx.api.sendMessage(
      chatId,
      '❌ Ocurrió un error al crear el módulo.\n\n' +
      `Detalles: ${errorMessage}\n\n` +
      'Por favor intenta de nuevo o revisa los logs.'
    );
  }
}

function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = '';

  const lines = text.split('\n');

  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
