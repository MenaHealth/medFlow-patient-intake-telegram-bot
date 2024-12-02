// bot.js
import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import translations from './translations.js';
import { createOrGetPatient } from './API.js';

dotenv.config();

// Determine environment and set bot token
const botToken = process.env.NODE_ENV === 'development'
    ? process.env.TELEGRAM_BOT_TOKEN_DEV
    : process.env.TELEGRAM_BOT_TOKEN;

// Initialize the Telegram Bot
const bot = new TelegramBot(botToken, { polling: true });

// Set API Base URL based on environment
const API_BASE_URL =
    process.env.NODE_ENV === 'development'
        ? process.env.DEV_PATIENT_FORM_BASE_URL || 'http://localhost:3000'
        : process.env.PATIENT_FORM_BASE_URL || 'https://medflow-mena-health.vercel.app';

const MEDFLOW_BOT_API_KEY =
    process.env.NODE_ENV === 'development'
        ? process.env.DEV_TELEGRAM_BOT_KEY
        : process.env.PROD_TELEGRAM_BOT_KEY;

console.log(`Selected MEDFLOW_BOT_API_KEY for ${process.env.NODE_ENV}: ${MEDFLOW_BOT_API_KEY}`);

// Supported languages
const languages = {
    1: 'English',
    2: 'العربية',
    3: 'فارسی',
    4: 'پښتو',
};

const userStates = {};

// Format language options for the prompt
const formatLanguageOption = (key, language) => `${key}. ${language}`;

// Send a language selection prompt
const sendLanguagePrompt = async (chatId) => {
    const message = Object.entries(languages)
        .map(([key, language]) => {
            const { language_prompt } = translations[language];
            return `${language_prompt}\n${formatLanguageOption(key, language)}`;
        })
        .join('\n\n');

    await bot.sendMessage(chatId, message);
};

// Handle user response after language selection
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


// Handle incoming Telegram messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();

    const messageData = {
        messageId: msg.message_id,
        text: msg.text || '',
        sender: msg.from.first_name || 'Unknown',
        timestamp: new Date(msg.date * 1000),
    };

    try {
        const apiUrl = `${API_BASE_URL}/api/telegram-bot/${chatId}/save-message`;

        console.log(`Attempting to send message to API URL: ${apiUrl}`);

        const encodedApiKey = encodeURIComponent(MEDFLOW_BOT_API_KEY);

        console.log('Encoded Authorization Header:', `Bearer ${encodedApiKey}`);

        const response = await axios.patch(apiUrl, messageData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${encodedApiKey}`, // Send the encoded key
            },
        });

        console.log(`Message sent to MedFlow server:`, response.data);
    } catch (error) {
        console.error('Error sending message to MedFlow server:', error.response?.data || error.message);
    }
});

// Start Bot
console.log('Telegram Bot is running and polling for messages...');