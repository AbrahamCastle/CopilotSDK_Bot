import { Context, SessionFlavor } from 'grammy';
import OpenAI from 'openai';
import { config } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { detectRecipeType } from '../../recipes/loader.js';
import { handleCrearInput } from './crear.js';
import { handleAgregarInput } from './agregar.js';
import { handleAnalizarInput } from './analizar.js';
import { handleFixBugInput } from './fixBug.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

const openai = config.openaiApiKey 
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

export async function voiceHandler(ctx: MyContext) {
  if (!ctx.message?.voice) {
    return;
  }

  if (!openai) {
    await ctx.reply(
      '⚠️ Transcripción de voz no configurada.\n\n' +
      'El administrador debe configurar OPENAI_API_KEY.'
    );
    return;
  }

  try {
    await ctx.reply('🎙️ Transcribiendo tu nota de voz...');

    // Descargar el archivo de voz
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${config.telegramToken}/${file.file_path}`;
    
    const response = await fetch(fileUrl);
    const audioBuffer = await response.arrayBuffer();
    
    // Crear un File object para Whisper API
    const audioFile = new File([new Blob([audioBuffer])], 'voice.ogg', {
      type: 'audio/ogg',
    });

    // Transcribir con Whisper
    logger.info('Transcribing voice message', { userId: ctx.from?.id });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    const text = transcription.text;
    logger.info('Voice transcribed', { userId: ctx.from?.id, text });

    await ctx.reply(`📝 Entendí:\n_"${text}"_\n\nProcesando...`);

    // Detectar tipo de comando y procesar
    const recipeType = detectRecipeType(text);

    if (!recipeType) {
      await ctx.reply(
        'No pude identificar qué acción quieres realizar.\n\n' +
        'Intenta con comandos como:\n' +
        '• /crear - Crear módulo\n' +
        '• /agregar - Agregar funcionalidad\n' +
        '• /analizar - Analizar módulo\n' +
        '• /fixbug - Corregir bug'
      );
      return;
    }

    // Procesar según el tipo
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
        await ctx.reply('Funcionalidad no implementada aún.');
    }

  } catch (error) {
    logger.error('Error processing voice message', { error });
    
    await ctx.reply(
      '❌ Error al procesar la nota de voz.\n\n' +
      'Asegúrate de que el audio sea claro y en español.'
    );
  }
}
