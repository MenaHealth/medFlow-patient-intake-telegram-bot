// bot.js
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { createOrGetPatient } from './API.js';

dotenv.config();

const userStates = {};

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('PATIENT_FORM_BASE_URL:', process.env.PATIENT_FORM_BASE_URL);
console.log('Bot token loaded:', process.env.TELEGRAM_BOT_TOKEN ? 'Yes' : 'No');

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (userStates[chatId]?.processing) {
    console.log(`Duplicate request for chat ID: ${chatId}. Ignoring.`);
    return;
  }

  userStates[chatId] = { processing: true };

  try {
    console.log(`Processing request for chat ID: ${chatId}`);
    await bot.sendMessage(chatId, "Processing your request. This may take a moment...");

    const response = await createOrGetPatient(chatId);
    console.log(`Received patient data:`, response);

    if (response.registrationUrl) {
      await bot.sendMessage(chatId, `Welcome! Please complete your registration using this link: ${response.registrationUrl}`);
    } else if (response.patientDashboardUrl) {
      await bot.sendMessage(chatId, `Welcome back! Here's your patient dashboard: ${response.patientDashboardUrl}`);
    } else {
      throw new Error('Unexpected response from server');
    }

    userStates[chatId] = { notified: true };
  } catch (error) {
    console.error('Error processing patient:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later or contact support.');
  } finally {
    userStates[chatId].processing = false;
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId]?.processing && !userStates[chatId]?.notified) {
    bot.sendMessage(chatId, "To start or continue the process, please send /start");
    userStates[chatId] = { ...userStates[chatId], notified: true };
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Bot is running...');