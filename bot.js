// bot.js
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import translations from './translations.js';
import { createOrGetPatient } from './API.js';

dotenv.config();

const isTesting = process.env.NODE_ENV === 'development';
const botToken = isTesting ? process.env.TELEGRAM_BOT_TOKEN_DEV : process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const languages = {
  1: 'English',
  2: 'العربية',
  3: 'فارسی',
  4: 'پښتو',
};

const userStates = {};

// Format language option
const formatLanguageOption = (key, language) => `${key}. ${language}`;

// Send language selection prompt
const sendLanguagePrompt = async (chatId) => {
  const message = Object.entries(languages)
      .map(([key, language]) => {
        const { language_prompt } = translations[language];
        return `${language_prompt}\n${formatLanguageOption(key, language)}`;
      })
      .join('\n\n');

  await bot.sendMessage(chatId, message);
};

// Handle user response
const handleUserResponse = async (chatId, selectedLanguage) => {
  const { processing, welcome, error: errorMessage } = translations[selectedLanguage];
  await bot.sendMessage(chatId, processing);

  try {
    const response = await createOrGetPatient(chatId, selectedLanguage);
    if (response.message) await bot.sendMessage(chatId, welcome);
    if (response.url) await bot.sendMessage(chatId, response.url);
  } catch (error) {
    console.error('Error processing patient:', error);
    await bot.sendMessage(chatId, errorMessage);
  }
};

// Bot message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId]) {
    userStates[chatId] = { languagePromptSent: false };
  }

  // Check if the user has already selected a language
  if (!userStates[chatId]?.language) {
    const languageKey = parseInt(msg.text);
    if (languageKey && languages[languageKey]) {
      const selectedLanguage = languages[languageKey];
      userStates[chatId] = { language: selectedLanguage };
      await handleUserResponse(chatId, selectedLanguage);
    } else if (!userStates[chatId].languagePromptSent) {
      // Send language prompt if no language is selected
      await sendLanguagePrompt(chatId);
      userStates[chatId].languagePromptSent = true;
    }
    return;
  }

  // Handle other messages if needed
});

console.log('Bot is running...');