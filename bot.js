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

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using Telegram Bot Token:', isTesting ? 'DEV' : 'PRODUCTION');
// console.log('Bot Token Value:', botToken);
console.log('Environment URL:', baseUrl);

// Verify values
if (!botToken) {
  throw new Error('Bot token is missing! Check your .env file or NODE_ENV value.');
}

if (isTesting && botToken === process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('Development mode is using the production bot token!');
}

const bot = new TelegramBot(botToken, { polling: true });
const userStates = {};

console.log('Bot pre reqs loaded...');


bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.chat.first_name;
  const lastName = msg.chat.last_name;

  if (userStates[chatId]?.processing) {
    console.log(`Duplicate request for chat ID: ${chatId}. Ignoring.`);
    return;
  }

  userStates[chatId] = { processing: true };

  try {
    console.log(`Processing request for chat ID: ${chatId}, first name: ${firstName}, last name: ${lastName}`);
    const response = await createOrGetPatient(chatId, firstName, lastName);
    console.log(`Received patient data:`, response);

    // Log debug info if present
    if (response.debug) {
      console.log("Debug Info from API:", response.debug);
    }

    if (response.message) {
      await bot.sendMessage(chatId, response.message);
    }
    if (response.url) {
      await bot.sendMessage(chatId, response.url);
    }
  } catch (error) {
    console.error('Error processing patient:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later or contact support.');
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
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (isTesting && botToken === process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("Development mode is using the production bot token!");
}

console.log('Bot loaded');
console.log('Base URL being used:', baseUrl);



