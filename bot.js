// bot.js
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createPatient } from './API.js';

// Track user states to prevent redundant messages
const userStates = {};

// Initialize the bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('PATIENT_FORM_BASE_URL:', process.env.PATIENT_FORM_BASE_URL);

// Add the /start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if user has already started
  if (userStates[chatId]?.started) {
    bot.sendMessage(chatId, 'You have already started the registration process. Please fill out the form or contact support if needed.');
    return;
  }

  try {
    const patientLink = await createPatient(chatId);
    bot.sendMessage(chatId, `Welcome! Please fill out the following form to complete your registration: ${patientLink}`);
    // Mark the user as having started
    userStates[chatId] = { started: true };
  } catch (error) {
    console.error('Error creating patient:', error);
    bot.sendMessage(chatId, 'Sorry, there was an issue creating your patient record. Please try again later or contact support.');
  }
});

// Handle any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Avoid sending generic messages repeatedly
  if (!userStates[chatId]?.notified) {
    bot.sendMessage(chatId, "To start the registration process, please send /start");
    userStates[chatId] = { ...userStates[chatId], notified: true };
  }
});

console.log('Bot is running...');