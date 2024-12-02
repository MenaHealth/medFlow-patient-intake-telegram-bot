// bot.js


import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import translations from './translations.js';
import { createOrGetPatient } from './API.js';

dotenv.config();

// Determine environment and set bot token
const botToken =
    process.env.NODE_ENV === 'development'
        ? process.env.TELEGRAM_BOT_TOKEN_DEV
        : process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
    console.error('Bot token is missing! Please check your environment variables.');
    process.exit(1);
}

// Initialize the Telegram Bot
const bot = new TelegramBot(botToken, { polling: true });

// Supported languages
const languages = {
    1: 'English',
    2: 'العربية',
    3: 'فارسی',
    4: 'پښتو',
};

const userStates = {};

// Send a language selection prompt
const sendLanguagePrompt = async (chatId) => {
    const message = `Please select your language by sending the number:\n\n` +
        Object.entries(languages)
            .map(([key, language]) => `${key} = ${language}`)
            .join('\n');
    await bot.sendMessage(chatId, message);
};

// Handle user language selection
const handleLanguageSelection = async (chatId, languageKey) => {
    const selectedLanguage = languages[languageKey];
    if (!selectedLanguage) {
        console.log(`Invalid language key received: ${languageKey}`);
        await bot.sendMessage(chatId, 'Invalid selection. Please try again.');
        return sendLanguagePrompt(chatId);
    }

    console.log(`Language selected for chat ID ${chatId}: ${selectedLanguage}`);
    userStates[chatId] = { language: selectedLanguage }; // Update user state

    const { processing } = translations[selectedLanguage];
    await bot.sendMessage(chatId, processing);

    try {
        const response = await createOrGetPatient(chatId, selectedLanguage);

        if (response.type === 'new') {
            await bot.sendMessage(chatId, response.message); // Raw success message
            await bot.sendMessage(chatId, response.url); // Registration URL
        } else if (response.type === 'existing') {
            await bot.sendMessage(chatId, response.message); // Existing patient message
        }
    } catch (error) {
        console.error('Error during patient registration:', error);
        await bot.sendMessage(chatId, translations[selectedLanguage].error);
    }
};

// Handle incoming messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();

    console.log(`Received message: Chat ID: ${chatId}, Text: ${text}`);

    // Handle language selection
    if (!userStates[chatId]) {
        if (Object.keys(languages).includes(text)) {
            console.log(`Valid language selection: ${text}`);
            return handleLanguageSelection(chatId, text);
        } else {
            console.log('Invalid language selection, prompting again.');
            return sendLanguagePrompt(chatId);
        }
    }

    const userState = userStates[chatId];
    console.log('Current user state:', userState);

    // Handle other inputs after language selection
    if (text === '9') {
        console.log('Emergency follow-up received.');
        return bot.sendMessage(chatId, translations[userState.language].prompts.follow_up);
    }

    console.log('Unhandled message, sending default response.');
    return bot.sendMessage(chatId, translations[userState.language].prompts.additional_message);
});

// Log when the bot starts
console.log('Telegram Bot is running and polling for messages...');