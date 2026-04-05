import { Bot, Context, session, SessionFlavor } from 'grammy';
import { config, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { copilotService } from './copilot/client.js';
import { authMiddleware } from './bot/middleware/auth.js';
import { loggingMiddleware } from './bot/middleware/logging.js';
import { crearHandler, handleCrearInput } from './bot/handlers/crear.js';
import { agregarHandler, handleAgregarInput } from './bot/handlers/agregar.js';
import { analizarHandler, handleAnalizarInput } from './bot/handlers/analizar.js';
import { fixBugHandler, handleFixBugInput } from './bot/handlers/fixBug.js';
import { voiceHandler } from './bot/handlers/voice.js';
import { detectRecipeType } from './recipes/loader.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

async function main() {
  // Validar configuración
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    logger.error('Configuration errors:', { errors: configErrors });
    console.error('\n❌ Configuration errors:');
    configErrors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file\n');
    process.exit(1);
  }

  logger.info('Starting SICEM Telegram Bot...');

  // Iniciar Copilot SDK
  try {
    await copilotService.start();
  } catch (error) {
    logger.error('Failed to start Copilot service', { error });
    console.error('\n❌ Could not start Copilot CLI');
    console.error('Make sure Copilot CLI is installed and in your PATH\n');
    process.exit(1);
  }

  // Crear bot de Telegram
  const bot = new Bot<MyContext>(config.telegramToken);

  // Middleware
  bot.use(session({ initial: (): SessionData => ({}) }));
  bot.use(loggingMiddleware);
  bot.use(authMiddleware);

  // Comandos
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '👋 **¡Bienvenido al Bot de SICEM!**\n\n' +
      'Puedo ayudarte a automatizar el desarrollo en SICEM usando GitHub Copilot.\n\n' +
        '**Comandos disponibles:**\n' +
        '• /crear - Crear módulo CRUD completo\n' +
        '• /agregar - Agregar funcionalidad a módulo existente\n' +
        '• /analizar - Analizar módulo en profundidad\n' +
        '• /fixbug - Corregir bug o regresión\n' +
        '• /refactorizar - Refactorizar componente\n' +
      '• /status - Ver estado del bot\n' +
      '• /help - Ver ayuda detallada\n\n' +
      '💡 También puedes enviarme notas de voz con tus comandos.'
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📚 **Ayuda - SICEM Bot**\n\n' +
      '**1. Crear Módulo CRUD**\n' +
      'Comando: /crear\n' +
      'Ejemplo: _"Crear módulo Proveedores con nombre, RFC, email"_\n\n' +
      '**2. Agregar Funcionalidad**\n' +
      'Comando: /agregar\n' +
      'Ejemplo: _"Agregar exportación a Excel en Clientes"_\n\n' +
        '**3. Analizar Módulo**\n' +
        'Comando: /analizar\n' +
        'Ejemplo: _"Analizar módulo de Cotizaciones"_\n\n' +
        '**4. Corregir Bug**\n' +
        'Comando: /fixbug\n' +
        'Ejemplo: _"Corregir bug en cotizaciones al guardar"_\n\n' +
        '**5. Refactorizar**\n' +
        'Comando: /refactorizar\n' +
        'Ejemplo: _"Refactorizar componente NewCotizacionModal"_\n\n' +
      '**Notas de Voz:**\n' +
      'Puedes enviar comandos de voz en español. El bot los transcribirá y ejecutará automáticamente.\n\n' +
      '**Modo Conversacional:**\n' +
      'También puedes escribir directamente sin comandos. El bot detectará tu intención.'
    );
  });

  bot.command('status', async (ctx) => {
    const copilotReady = copilotService.isReady();
    
    await ctx.reply(
      '📊 **Estado del Bot**\n\n' +
      `🤖 Copilot SDK: ${copilotReady ? '✅ Conectado' : '❌ Desconectado'}\n` +
      `🔊 Transcripción de voz: ${config.openaiApiKey ? '✅ Habilitada' : '❌ Deshabilitada'}\n` +
      `📂 Repositorio: ${config.sicemRepoOwner}/${config.sicemRepoName}\n` +
      `🌿 Branch: ${config.sicemRepoBranch}\n` +
      `🤖 Modelo: ${config.copilotModel}`
    );
  });

  // Handlers de comandos principales
  bot.command('crear', crearHandler);
  bot.command('agregar', agregarHandler);
  bot.command('analizar', analizarHandler);
  bot.command('fixbug', fixBugHandler);
  
  bot.command('refactorizar', async (ctx) => {
    await ctx.reply(
      '🔧 **Refactorizar Componente**\n\n' +
      'Cuéntame qué componente o archivo quieres refactorizar y por qué.\n\n' +
      '**Ejemplo:**\n' +
      '_"Refactorizar NewCotizacionModal porque es muy grande"_'
    );
    ctx.session.waitingFor = 'refactorizar-input';
  });

  // Handler de voz
  bot.on('message:voice', voiceHandler);

  // Handler de texto (conversacional)
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;

    // Si estamos esperando input para un comando específico
    if (ctx.session.waitingFor) {
      const waitingFor = ctx.session.waitingFor;
      ctx.session.waitingFor = undefined;

      switch (waitingFor) {
        case 'crear-input':
          await handleCrearInput(ctx, text);
          break;
        case 'agregar-input':
          await handleAgregarInput(ctx, text);
          break;
        case 'analizar-input':
          await handleAnalizarInput(ctx, text);
          break;
        case 'fix-bug-input':
          await handleFixBugInput(ctx, text);
          break;
        case 'refactorizar-input':
          // Similar a otros handlers
          await ctx.reply('⏳ Refactorizando... (funcionalidad en desarrollo)');
          break;
        default:
          await ctx.reply('No entendí el contexto. Intenta con un comando como /crear');
      }
      return;
    }

    // Modo conversacional - detectar intención
    const recipeType = detectRecipeType(text);

    if (recipeType) {
      switch (recipeType) {
        case 'crear-crud-completo':
          await handleCrearInput(ctx, text);
          break;
        case 'agregar-funcionalidad':
          await handleAgregarInput(ctx, text);
          break;
        case 'analizar-modulo':
          await handleAnalizarInput(ctx, text);
          break;
        case 'fix-bug':
          await handleFixBugInput(ctx, text);
          break;
        default:
          await ctx.reply(
            'Entendí tu intención pero esa funcionalidad aún no está lista.\n\n' +
            'Prueba con: /crear, /agregar, /analizar o /fixbug'
          );
      }
    } else {
      // No se detectó intención clara
      await ctx.reply(
        'No estoy seguro de qué necesitas. ¿Quieres:\n\n' +
        '• /crear - Crear un módulo nuevo\n' +
        '• /agregar - Agregar funcionalidad a módulo existente\n' +
        '• /analizar - Analizar un módulo\n' +
        '• /fixbug - Corregir un bug o regresión\n' +
        '• /help - Ver ayuda completa'
      );
    }
  });

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    logger.error('Error in bot', {
      error: err.error,
      userId: ctx.from?.id,
    });
    
    ctx.reply(
      '❌ Ocurrió un error inesperado.\n\n' +
      'El equipo ha sido notificado. Por favor intenta de nuevo más tarde.'
    );
  });

  // Iniciar bot
  logger.info('Bot initialized, starting polling...');
  await bot.start();
  
  logger.info('Bot is running! Press Ctrl+C to stop.');

  // Graceful shutdown
  process.once('SIGINT', async () => {
    logger.info('SIGINT received, stopping bot...');
    await bot.stop();
    await copilotService.stop();
    logger.info('Bot stopped gracefully');
    process.exit(0);
  });

  process.once('SIGTERM', async () => {
    logger.info('SIGTERM received, stopping bot...');
    await bot.stop();
    await copilotService.stop();
    logger.info('Bot stopped gracefully');
    process.exit(0);
  });
}

// Iniciar
main().catch((error) => {
  logger.error('Fatal error', { error });
  console.error('Fatal error:', error);
  process.exit(1);
});
