import { Context } from 'grammy';
import { logger } from '../../utils/logger.js';

export async function loggingMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const messageType = ctx.message?.text ? 'text' : ctx.message?.voice ? 'voice' : 'other';
  const text = ctx.message?.text?.slice(0, 50);

  logger.info('Incoming message', {
    userId,
    username,
    messageType,
    text,
  });

  try {
    await next();
  } catch (error) {
    logger.error('Error handling message', {
      userId,
      username,
      error,
    });
    throw error;
  }
}
