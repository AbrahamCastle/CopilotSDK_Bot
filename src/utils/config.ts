import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Telegram
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // GitHub
  githubToken: process.env.GITHUB_TOKEN || '',
  sicemRepoOwner: process.env.SICEM_REPO_OWNER || '',
  sicemRepoName: process.env.SICEM_REPO_NAME || 'SICEM',
  sicemRepoBranch: process.env.SICEM_REPO_BRANCH || 'main',
  sicemRepoPath: process.env.SICEM_REPO_PATH || './workspace/sicem',
  
  // OpenAI (opcional)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  // Seguridad
  authorizedUsers: process.env.AUTHORIZED_USERS 
    ? process.env.AUTHORIZED_USERS.split(',').map(id => parseInt(id.trim()))
    : [],
  
  // Copilot
  copilotModel: process.env.COPILOT_MODEL || 'claude-sonnet-4.5',
  
  // App
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

export function validateConfig(): string[] {
  const errors: string[] = [];
  
  if (!config.telegramToken) {
    errors.push('TELEGRAM_BOT_TOKEN is required');
  }
  
  if (!config.githubToken) {
    errors.push('GITHUB_TOKEN is required');
  }
  
  if (!config.sicemRepoOwner) {
    errors.push('SICEM_REPO_OWNER is required');
  }
  
  return errors;
}
