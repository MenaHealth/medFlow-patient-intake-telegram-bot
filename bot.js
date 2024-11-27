// bot.js
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createPatient } from './API.js';

// Initialize the bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('PATIENT_FORM_BASE_URL:', process.env.PATIENT_FORM_BASE_URL);

// Add the /start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const patientLink = await createPatient(chatId);
    bot.sendMessage(chatId, `Welcome! Please fill out the following form to complete your registration: ${patientLink}`);
  } catch (error) {
    console.error('Error creating patient:', error);
    bot.sendMessage(chatId, 'Sorry, there was an issue creating your patient record. Please try again later or contact support.');
  }
});

// Handle any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "To start the registration process, please send /start");
});

console.log('Bot is running...');







