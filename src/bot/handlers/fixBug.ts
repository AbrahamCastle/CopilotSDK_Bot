import { Context, SessionFlavor } from 'grammy';
import { logger } from '../../utils/logger.js';
import { copilotService } from '../../copilot/client.js';
import { loadRecipe, personalizeRecipe } from '../../recipes/loader.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

export async function fixBugHandler(ctx: MyContext) {
  logger.info('Command /fixbug invoked', { userId: ctx.from?.id });

  await ctx.reply(
    '🐛 **Corregir Bug / Regresión**\n\n' +
      'Describe el bug con el mayor detalle posible:\n\n' +
      '• Dónde ocurre (módulo/pantalla)\n' +
      '• Pasos para reproducir\n' +
      '• Resultado actual vs esperado\n' +
      '• Severidad (alta/media/baja)\n\n' +
      '**Ejemplo:**\n' +
      '_"Corregir bug en cotizaciones: al guardar con RFC válido marca error. Pasa siempre."_'
  );

  ctx.session.waitingFor = 'fix-bug-input';
}

export async function handleFixBugInput(ctx: MyContext, userInput: string) {
  const chatId = ctx.chat?.id;

  if (!chatId) {
    await ctx.reply('❌ Error: No se pudo identificar el chat');
    return;
  }

  await ctx.reply(
    '⏳ Procesando tu solicitud de fix...\n\n' +
      'Esto puede tardar 1-3 minutos. Te notificaré cuando esté listo.'
  );

  processFixBugInBackground(ctx, userInput, chatId).catch((error) => {
    logger.error('Fatal error in fix-bug background processing', { error });
  });
}

async function processFixBugInBackground(
  ctx: MyContext,
  userInput: string,
  chatId: number
) {
  try {
    logger.info('🔄 INICIANDO: Fix de bug', { userInput });
    console.log('\n🔄 Cargando receta fix-bug...');

    const recipeTemplate = await loadRecipe('fix-bug');
    const personalizedPrompt = personalizeRecipe(recipeTemplate, userInput);

    const commitMessage = `fix: ${userInput.substring(0, 50)}`;
    console.log('🤖 Ejecutando fix con Copilot...');

    const { response: result, prUrl } = await copilotService.executeRecipeWithAutoCommit(
      personalizedPrompt,
      commitMessage
    );

    const maxLength = 4000;
    if (result.length > maxLength) {
      const chunks = splitMessage(result, maxLength);
      await ctx.api.sendMessage(chatId, '✅ **¡Bug corregido!**\n\n');
      for (const chunk of chunks) {
        await ctx.api.sendMessage(chatId, chunk);
      }
    } else {
      await ctx.api.sendMessage(chatId, '✅ **¡Bug corregido!**\n\n' + result);
    }

    if (prUrl) {
      await ctx.api.sendMessage(chatId, `🔀 **Pull Request creado:**\n${prUrl}`);
    }

    logger.info('✅ FINALIZADO: Fix de bug completado', {
      userId: ctx.from?.id,
      userInput,
      prUrl,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ ERROR: Fallo en fix de bug', {
      error: errorMessage,
      stack: errorStack,
      userInput,
    });

    await ctx.api.sendMessage(
      chatId,
      '❌ Ocurrió un error al corregir el bug.\n\n' +
        `Detalles: ${errorMessage}\n\n` +
        'Por favor intenta de nuevo.'
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
