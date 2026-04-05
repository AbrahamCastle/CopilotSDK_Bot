import { Context, SessionFlavor } from 'grammy';
import { logger } from '../../utils/logger.js';
import { copilotService } from '../../copilot/client.js';
import { loadRecipe, personalizeRecipe } from '../../recipes/loader.js';

interface SessionData {
  waitingFor?: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

export async function agregarHandler(ctx: MyContext) {
  logger.info('Command /agregar invoked', { userId: ctx.from?.id });

  await ctx.reply(
    '🔧 **Agregar Funcionalidad**\n\n' +
    'Cuéntame qué funcionalidad quieres agregar y a qué módulo:\n\n' +
    '**Ejemplos:**\n' +
    '• _"Agregar exportación a Excel en módulo de Clientes"_\n' +
    '• _"Importar CSV en módulo de Cotizaciones"_\n' +
    '• _"Historial de cambios en módulo de Usuarios"_\n' +
    '• _"Generar PDF en módulo de Facturas"_\n' +
    '• _"Generar PDF de cotizaciones"_\n' +
    '• _"Descargar reporte PDF en Inventario"_'
  );

  ctx.session.waitingFor = 'agregar-input';
}

export async function handleAgregarInput(ctx: MyContext, userInput: string) {
  const chatId = ctx.chat?.id;
  
  if (!chatId) {
    await ctx.reply('❌ Error: No se pudo identificar el chat');
    return;
  }

  // Responder inmediatamente para evitar timeout de Telegram
  await ctx.reply('⏳ Procesando tu solicitud...\n\nEsto puede tardar 1-2 minutos. Te notificaré cuando esté listo.');

  // Procesar en background
  processAgregarInBackground(ctx, userInput, chatId).catch(error => {
    logger.error('Fatal error in background processing', { error });
  });
}

async function processAgregarInBackground(
  ctx: MyContext, 
  userInput: string,
  chatId: number
) {
  try {
    logger.info('🔄 INICIANDO: Carga de receta', { userInput });
    console.log('\n🔄 Cargando receta de agregar funcionalidad...');

    const recipeTemplate = await loadRecipe('agregar-funcionalidad');
    logger.info('✅ Receta cargada', { size: recipeTemplate.length });
    console.log('✅ Receta cargada exitosamente');

    logger.info('🔄 PERSONALIZANDO: Prompt con input del usuario');
    console.log('🔄 Personalizando receta...');
    const personalizedPrompt = personalizeRecipe(recipeTemplate, userInput);
    console.log('✅ Receta personalizada');

    logger.info('🔄 EJECUTANDO: Copilot con auto-commit');
    console.log('\n🤖 Ejecutando Copilot...');
    console.log('📝 Request:', userInput);

    // Ejecutar con auto-commit y PR
    const commitMessage = `feat: ${userInput.substring(0, 50)}`;
    
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

    // Obtener archivos modificados
    logger.info('🔄 VERIFICANDO: Archivos modificados');
    console.log('🔍 Verificando cambios en git...');
    const changedFiles = await copilotService.getChangedFiles();
    
    if (changedFiles.length > 0) {
      console.log(`📁 ${changedFiles.length} archivo(s) modificado(s):`);
      changedFiles.forEach(file => console.log(`   • ${file}`));
    } else {
      console.log('ℹ️  No se detectaron cambios en git');
    }

    // Enviar resultado al usuario
    logger.info('📤 ENVIANDO: Resultado a Telegram');
    console.log('\n📤 Enviando resultado a Telegram...');

    // Mostrar la respuesta de Copilot
    const maxLength = 4000;
    if (result.length > maxLength) {
      const chunks = splitMessage(result, maxLength);
      await ctx.api.sendMessage(chatId, '✅ **¡Cambios ejecutados exitosamente!**\n\n');
      for (const chunk of chunks) {
        await ctx.api.sendMessage(chatId, chunk);
      }
    } else {
      await ctx.api.sendMessage(
        chatId,
        '✅ **¡Cambios ejecutados exitosamente!**\n\n' + result
      );
    }

    // Mostrar PR y archivos
    let finalMessage = '';
    
    if (prUrl) {
      finalMessage += `🔀 **Pull Request creado:**\n${prUrl}\n\n`;
    }

    if (changedFiles.length > 0) {
      finalMessage += '📁 **Archivos modificados:**\n' +
        changedFiles.slice(0, 10).map(f => `• ${f}`).join('\n') +
        (changedFiles.length > 10 ? `\n...y ${changedFiles.length - 10} más` : '');
    }

    if (finalMessage) {
      await ctx.api.sendMessage(chatId, finalMessage);
    }

    logger.info('✅ FINALIZADO: Proceso completado exitosamente', {
      userId: ctx.from?.id,
      userInput,
      filesChanged: changedFiles.length,
      prUrl,
    });
    console.log('✅ Proceso finalizado exitosamente\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('❌ ERROR: Fallo en el procesamiento', { 
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
      '❌ Ocurrió un error al agregar la funcionalidad.\n\n' +
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
