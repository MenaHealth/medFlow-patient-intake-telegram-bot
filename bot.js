// bot.js
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import translations from './translations.js';
import { createOrGetPatient } from './API.js';

dotenv.config();

const isTesting = process.env.NODE_ENV === 'development';
const botToken = isTesting ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = isTesting
    ? process.env.DEV_PATIENT_FORM_BASE_URL
    : process.env.PATIENT_FORM_BASE_URL;

console.log('Bot pre reqs loaded...');

const bot = new TelegramBot(botToken, { polling: true });

console.log('Bot loaded');

// Languages object for prompts
const languages = {
  1: 'English',
  2: 'العربية',
  3: 'فارسی',
  4: 'پښتو',
};

// Initialize user states
const userStates = {};

// Function to format language option
const formatLanguageOption = (key, language) => {
  if (['العربية', 'فارسی', 'پښتو'].includes(language)) {
    return `${key}. ${language}`;
  }
  return `${key}. ${language}`;
};

// Function to send language selection prompt
const sendLanguagePrompt = async (chatId) => {
  const message =
      'Please select your language by sending the number:\n' +
      Object.entries(languages)
          .map(([key, language]) => formatLanguageOption(key, language))
          .join('\n');

  await bot.sendMessage(chatId, message);
};

// Bot message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Check if language is already selected
  if (!userStates[chatId]?.language) {
    const languageKey = parseInt(msg.text);
    if (languageKey && languages[languageKey]) {
      const selectedLanguage = languages[languageKey];
      userStates[chatId] = { ...userStates[chatId], language: selectedLanguage };

      const { processing } = translations[selectedLanguage];
      await bot.sendMessage(chatId, processing);

      try {
        const response = await createOrGetPatient(chatId, selectedLanguage);
        if (response.message) {
          const { welcome } = translations[selectedLanguage];
          await bot.sendMessage(chatId, welcome);
        }
        if (response.url) {
          await bot.sendMessage(chatId, response.url);
        }
      } catch (error) {
        console.error('Error processing patient:', error);
        await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later.');
      }
    } else {
      await sendLanguagePrompt(chatId);
    }
    return;
  }

  // Handle other commands or messages here
  const text = msg.text?.trim();
  if (text === '/start') {
    if (!userStates[chatId]?.processing) {
      await bot.sendMessage(chatId, "To start or continue the process, please send /start");
      userStates[chatId] = { ...userStates[chatId], notified: true };
    }
  }
});

// `/start` command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (userStates[chatId]?.processing) {
    console.log(`Duplicate request for chat ID: ${chatId}. Ignoring.`);
    return;
  }

  userStates[chatId] = { processing: true };

  try {
    if (!userStates[chatId]?.language) {
      await sendLanguagePrompt(chatId);
      userStates[chatId].processing = false;
      return;
    }

    const selectedLanguage = userStates[chatId]?.language;
    const { welcome } = translations[selectedLanguage];
    const response = await createOrGetPatient(chatId, selectedLanguage);

    if (response.message) {
      await bot.sendMessage(chatId, welcome);
    }
    if (response.url) {
      await bot.sendMessage(chatId, response.url);
    }
  } catch (error) {
    console.error('Error processing patient:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later.');
  } finally {
    userStates[chatId].processing = false;
  }
});

console.log('Bot loaded');
