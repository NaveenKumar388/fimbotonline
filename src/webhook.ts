import TelegramBot from 'node-telegram-bot-api';

export async function setupWebhook(bot: TelegramBot) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await bot.setWebHook(`${webhookUrl}/webhook`);
      console.log(`Webhook set to ${webhookUrl}/webhook`);
    } catch (error) {
      console.error('Failed to set webhook:', error);
    }
  } else {
    console.warn('WEBHOOK_URL is not set. Webhook setup skipped.');
  }
}


