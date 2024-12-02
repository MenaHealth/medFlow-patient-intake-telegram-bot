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

const API_BASE_URL =
    process.env.NODE_ENV === 'development'
        ? process.env.DEV_PATIENT_FORM_BASE_URL
        : process.env.PATIENT_FORM_BASE_URL;

if (!API_BASE_URL) {
    console.error('API_BASE_URL is missing! Please check your environment variables.');
    process.exit(1);
}

const TELEGRAM_BOT_KEY =
    process.env.NODE_ENV === 'development'
        ? process.env.DEV_TELEGRAM_BOT_KEY
        : process.env.PROD_TELEGRAM_BOT_KEY;

if (!TELEGRAM_BOT_KEY) {
    console.error('TELEGRAM_BOT_KEY is missing! Please check your environment variables.');
    process.exit(1);
}

console.log("Loaded Environment Variables:");
console.log({
    NODE_ENV: process.env.NODE_ENV,
    TELEGRAM_BOT_TOKEN: botToken,
    API_BASE_URL,
    TELEGRAM_BOT_KEY,
});



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
    const timestamp = new Date();

    // Log the incoming message
    console.log("Received message:", { chatId, text, timestamp });

    try {
        // Step 1: Attempt to save the message to the thread
        const saveMessageResponse = await axios.patch(
            `${API_BASE_URL}/api/telegram-bot/${chatId}/save-message`,
            {
                text,
                sender: "patient",
                timestamp,
            },
            {
                headers: {
                    Authorization: `Bearer ${encodeURIComponent(TELEGRAM_BOT_KEY)}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Save message response:", saveMessageResponse.data);

        // Step 2: If the thread doesn't exist, trigger patient registration
        if (saveMessageResponse.data.status === "ThreadNotFound") {
            console.log("Thread not found. Initiating patient registration.");

            const language = userStates[chatId]?.language || "english";
            const registrationResponse = await createOrGetPatient(chatId, language);

            if (registrationResponse.type === "new") {
                await bot.sendMessage(chatId, registrationResponse.message);
                await bot.sendMessage(chatId, registrationResponse.url);
            } else if (registrationResponse.type === "existing") {
                await bot.sendMessage(chatId, registrationResponse.message);
            }
        }
    } catch (error) {
        // Step 3: Handle errors during saving or registration
        console.error("Error handling incoming message:");
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else {
            console.error("No response received from API.");
        }

        // Fallback: Send a language selection prompt if no state exists
        if (!userStates[chatId]) {
            console.log("No user state found. Sending language selection prompt.");
            return sendLanguagePrompt(chatId);
        }
    }
});

// Log when the bot starts
console.log('Telegram Bot is running and polling for messages...');