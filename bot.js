// bot.js
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createOrGetPatient } from './API.js';

// Track user states to prevent redundant messages
const userStates = {};

// Initialize the bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('PATIENT_FORM_BASE_URL:', process.env.PATIENT_FORM_BASE_URL);

// Add the /start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const patientLink = await createOrGetPatient(chatId);
    if (patientLink.includes('/register/')) {
      bot.sendMessage(chatId, `Welcome! Please fill out the following form to complete your registration: ${patientLink}`);
      userStates[chatId] = { started: true };
    } else {
      bot.sendMessage(chatId, `Welcome back! Here's your patient dashboard: ${patientLink}`);
    }
  } catch (error) {
    console.error('Error processing patient:', error);
    bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later or contact support.');
  }
});

// Handle any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Avoid sending generic messages repeatedly
  if (!userStates[chatId]?.notified) {
    bot.sendMessage(chatId, "To start or continue the process, please send /start");
    userStates[chatId] = { ...userStates[chatId], notified: true };
  }
});

console.log('Bot is running...');


