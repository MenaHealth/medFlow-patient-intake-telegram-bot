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

console.log('Bot pre reqs loaded...');

const bot = new TelegramBot(botToken, { polling: true });


console.log('Bot loaded');

// Function to format language option
const formatLanguageOption = (key, language) => {
  // For RTL languages, add padding to align right
  if (['العربية', 'فارسی', 'پښتو'].some(rtl => language.includes(rtl))) {
    return `${key}. ${language}`;
  }
  // For English, align left
  return `${key}. ${language}`;
};

// Function to send language selection prompt
const sendLanguagePrompt = async (chatId) => {
  const message = 'Please select your language by sending the number:\n' +
      Object.entries(languages)
          .map(([key, language]) => formatLanguageOption(key, language))
          .join('\n');

  await bot.sendMessage(chatId, message);
};

// Update your languages object
const languages = {
  1: 'English',
  2: 'العربية (Arabic)',
  3: 'فارسی (Farsi)',
  4: 'پښتو (Pashto)'  // Updated to show Pashto text first
};

// Initialize user states (assuming this is a global object or accessible elsewhere)
const userStates = {};

// Update message handler to check for numeric input only
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  //const text = msg.text?.trim(); //Removed as per update 1

  // Check if language is already selected
  if (!userStates[chatId]?.language) {
    // Check if input is a number and matches a valid language key
    const languageKey = parseInt(msg.text); //Update to use msg.text directly
    if (languageKey && languages[languageKey]) {
      const selectedLanguage = languages[languageKey];
      userStates[chatId] = { ...userStates[chatId], language: selectedLanguage };
      await bot.sendMessage(chatId, `You selected ${selectedLanguage}. Processing your information...`);

      try {
        const response = await createOrGetPatient(chatId, selectedLanguage);
        if (response.message) {
          await bot.sendMessage(chatId, response.message);
        }
        if (response.url) {
          await bot.sendMessage(chatId, response.url);
        }
      } catch (error) {
        console.error('Error processing patient:', error);
        await bot.sendMessage(chatId, 'Sorry, there was an issue processing your request. Please try again later.');
      }
    } else {
      // Prompt for language selection
      await sendLanguagePrompt(chatId);
    }
    return;
  }

  // If language is already selected, you can handle other commands or messages here
  // For example, you might want to check for the /start command
  const text = msg.text?.trim(); //Added back here to handle /start command
  if (text === '/start') {
    if (!userStates[chatId]?.processing) {
      await bot.sendMessage(chatId, "To start or continue the process, please send /start");
      userStates[chatId] = { ...userStates[chatId], notified: true };
    }
  }
});

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

    const response = await createOrGetPatient(chatId, userStates[chatId]?.language);
    if (response.message) {
      await bot.sendMessage(chatId, response.message);
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




