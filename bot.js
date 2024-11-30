// bot.js
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { createOrGetPatient } from './API.js';

dotenv.config();

const isTesting = process.env.NODE_ENV === 'development';
const botToken = isTesting ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = isTesting
    ? process.env.DEV_PATIENT_FORM_BASE_URL
    : process.env.PATIENT_FORM_BASE_URL;

// Minimal startup logging
console.log('Starting Telegram bot...');
console.log('Environment:', isTesting ? 'Development' : 'Production');
console.log('Base URL:', baseUrl);

// Verify critical configuration
if (!botToken) {
  throw new Error('Bot token is missing! Check your .env file or NODE_ENV value.');
}

const bot = new TelegramBot(botToken, { polling: true });
const userStates = {};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.chat.first_name;
  const lastName = msg.chat.last_name;

  if (userStates[chatId]?.processing) {
    console.warn(`Duplicate request ignored for chat ID: ${chatId}`);
    return;
  }

  userStates[chatId] = { processing: true };

  try {
    console.log(`Processing /start for chat ID: ${chatId}`);
    const response = await createOrGetPatient(chatId, firstName, lastName);

    if (response.message) {
      await bot.sendMessage(chatId, response.message);
    }
    if (response.url) {
      await bot.sendMessage(chatId, response.url);
    }
  } catch (error) {
    console.error('Error processing /start command:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later.');
  } finally {
    userStates[chatId].processing = false;
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId]?.processing && !msg.text.startsWith('/start')) {
    if (!userStates[chatId]?.notified) {
      bot.sendMessage(chatId, "To start or continue the process, please send /start");
      userStates[chatId] = { ...userStates[chatId], notified: true };
    }
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message || error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('Telegram bot is up and running.');
