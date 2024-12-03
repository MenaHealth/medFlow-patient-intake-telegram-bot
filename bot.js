// bot.js

import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { languagePromptMessage, languages } from "./utils/languagePrompt.js";
import { saveMessage } from "./saveMessage.js";
import { saveTelegramThread } from "./saveTelegramThread.js";
import { createPatient } from "./createPatient.js";

dotenv.config();

const botToken =
    process.env.NODE_ENV === "development"
        ? process.env.TELEGRAM_BOT_TOKEN_DEV
        : process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
    console.error("Bot token is missing! Please check your environment variables.");
    process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: true });
const userStates = {}; // Store user states by chat ID

// Function to send language prompt
const sendLanguagePrompt = async (chatId) => {
    try {
        await bot.sendMessage(chatId, languagePromptMessage);
        console.log(`[INFO] Language prompt sent to chat ID ${chatId}`);
    } catch (error) {
        console.error(`[ERROR] Failed to send language prompt to chat ID ${chatId}:`, error);
    }
};

// Handle incoming messages
bot.on("message", async (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();
    const timestamp = new Date();

    console.log(`[DEBUG] Received message from chat ID ${chatId}: "${text}"`);

    // Save the incoming message to the API
    try {
        await saveMessage(chatId, text, "patient", timestamp);
    } catch (error) {
        console.error(`[ERROR] Failed to save message for chat ID ${chatId}:`, error);
    }

    // Check if the user has an existing state
    if (!userStates[chatId]) {
        console.log(`[INFO] No user state for chat ID ${chatId}. Saving Telegram thread and sending language prompt.`);
        try {
            await saveTelegramThread(chatId, "en");
        } catch (error) {
            console.error(`[ERROR] Failed to save Telegram thread for chat ID ${chatId}:`, error);
        }

        await sendLanguagePrompt(chatId);
        userStates[chatId] = { language: null }; // Initialize the user state without a language
        return;
    }

    const userState = userStates[chatId];

    if (!userState.language) {
        console.log(`[INFO] Processing language selection for chat ID ${chatId}`);
        const languageKey = parseInt(text); // Convert the response to an integer

        const selectedLanguageMap = {
            1: "English",
            2: "Arabic",
            3: "Farsi",
            4: "Pashto",
        };

        const selectedLanguage = selectedLanguageMap[languageKey];
        if (selectedLanguage) {
            userStates[chatId].language = selectedLanguage;

            try {
                // Call the new-patient API to create a patient with the selected language
                await createPatient(chatId, selectedLanguage);
            } catch (error) {
                console.error(`[ERROR] Failed to process patient creation for chat ID ${chatId}:`, error);
                await bot.sendMessage(chatId, "An error occurred. Please try again later.");
            }
        } else {
            console.warn(`[WARN] Invalid language key "${languageKey}" for chat ID ${chatId}`);
            await bot.sendMessage(chatId, "Invalid selection. Please send a number between 1 and 4.");
            await sendLanguagePrompt(chatId);
        }
        return;
    }

    console.log(`[INFO] User state for chat ID ${chatId}:`, userStates[chatId]);
});