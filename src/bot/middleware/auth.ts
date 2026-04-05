import { Context } from 'grammy';
import { config } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';

export function isAuthorized(ctx: Context): boolean {
  const userId = ctx.from?.id;

  if (!userId) {
    logger.warn('Message received without user ID');
    return false;
  }

  // Si no hay restricciones, permitir a todos
  if (config.authorizedUsers.length === 0) {
    return true;
  }

  const authorized = config.authorizedUsers.includes(userId);

  if (!authorized) {
    logger.warn('Unauthorized access attempt', { userId });
  }

  return authorized;
}

export async function authMiddleware(ctx: Context, next: () => Promise<void>) {
  if (!isAuthorized(ctx)) {
    await ctx.reply(
      '🚫 No tienes autorización para usar este bot.\n\n' +
      'Contacta al administrador para obtener acceso.'
    );
    return;
  }

  await next();
}
