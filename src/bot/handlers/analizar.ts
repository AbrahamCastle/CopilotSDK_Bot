import { Context, SessionFlavor } from 'grammy';
import { logger } from '../../utils/logger.js';
import { copilotService } from '../../copilot/client.js';
import { loadRecipe, personalizeRecipe } from '../../recipes/loader.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

export async function analizarHandler(ctx: MyContext) {
  logger.info('Command /analizar invoked', { userId: ctx.from?.id });

  await ctx.reply(
    '🔍 **Analizar Módulo**\n\n' +
    '¿Qué módulo quieres analizar?\n\n' +
    '**Ejemplos:**\n' +
    '• _"Cotizaciones"_\n' +
    '• _"Clientes"_\n' +
    '• _"Usuarios"_\n\n' +
    'Opcional: especifica qué aspecto analizar:\n' +
    '• _"Analizar performance del módulo de Cotizaciones"_\n' +
    '• _"Analizar seguridad en módulo de Usuarios"_'
  );

  ctx.session.waitingFor = 'analizar-input';
}

export async function handleAnalizarInput(ctx: MyContext, userInput: string) {
  try {
    await ctx.reply('⏳ Cargando receta de análisis...');

    const recipeTemplate = await loadRecipe('analizar-modulo');
    const personalizedPrompt = personalizeRecipe(recipeTemplate, userInput);

    await ctx.reply(
      '🔍 Copilot está analizando el módulo...\n' +
      'Esto puede tardar 1-2 minutos.'
    );

    const result = await copilotService.executeRecipe(personalizedPrompt);

    // El resultado del análisis suele ser largo, enviarlo en partes
    const maxLength = 4000; // Límite de Telegram
    if (result.length > maxLength) {
      const chunks = splitMessage(result, maxLength);
      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    } else {
      await ctx.reply(`📊 **Análisis completado:**\n\n${result}`);
    }

    logger.info('Analysis completed successfully', {
      userId: ctx.from?.id,
      userInput,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Error analyzing module', { 
      error: errorMessage,
      stack: errorStack,
      userInput 
    });
    
    await ctx.reply(
      '❌ Ocurrió un error al analizar el módulo.\n\n' +
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
