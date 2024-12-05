// bot.js

// bot.js

import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { languagePromptMessage } from "./utils/languagePrompt.js";
import { saveTelegramThread } from "./saveTelegramThread.js";
import { createPatient } from "./createPatient.js";
import { saveText } from "./save-messages/saveText.js";
import { saveAudio } from "./save-messages/saveAudio.js";
import { saveImage } from "./save-messages/saveImages.js";

dotenv.config();

// Load environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const MEDFLOW_KEY = process.env.MEDFLOW_KEY;

// Validate the required environment variables
if (!botToken) {
    console.error("[ERROR] Bot token is missing! Please check your environment variables.");
    process.exit(1);
}

if (!MEDFLOW_KEY) {
    console.error("[ERROR] MEDFLOW_KEY is missing! Please check your environment variables.");
    process.exit(1);
}

// Initialize the Telegram bot
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
    const timestamp = new Date();

    if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const caption = msg.caption?.trim() || "";

        try {
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;

            console.log(`[INFO] Received image message for chat ID ${chatId}: ${fileUrl}, caption: "${caption}"`);

            await saveImage(chatId, fileUrl, "patient", timestamp, caption, MEDFLOW_KEY);
        } catch (error) {
            console.error(`[ERROR] Failed to process image message for chat ID ${chatId}:`, error);
        }

        return;
    }

    if (msg.audio || msg.voice) {
        const fileId = msg.audio?.file_id || msg.voice?.file_id;

        try {
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;

            console.log(`[INFO] Received audio message for chat ID ${chatId}: ${fileUrl}`);

            await saveAudio(chatId, fileUrl, "patient", timestamp, MEDFLOW_KEY);
        } catch (error) {
            console.error(`[ERROR] Failed to process audio message for chat ID ${chatId}:`, error);
        }

        return;
    }

    const text = msg.text?.trim();
    if (text) {
        try {
            await saveText(chatId, text, "patient", timestamp, MEDFLOW_KEY);
        } catch (error) {
            console.error(`[ERROR] Failed to save text message for chat ID ${chatId}:`, error);
        }
    }

    console.log(`[DEBUG] Received message from chat ID ${chatId}: "${text}"`);

    if (!userStates[chatId]) {
        console.log(`[INFO] No user state for chat ID ${chatId}. Saving Telegram thread and sending language prompt.`);
        try {
            await saveTelegramThread(chatId, "en", MEDFLOW_KEY);
        } catch (error) {
            console.error(`[ERROR] Failed to save Telegram thread for chat ID ${chatId}:`, error);
        }

        await sendLanguagePrompt(chatId);
        userStates[chatId] = { language: null };
        return;
    }

    const userState = userStates[chatId];

    if (!userState.language) {
        console.log(`[INFO] Processing language selection for chat ID ${chatId}`);
        const languageKey = parseInt(text);

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
                await createPatient(chatId, selectedLanguage, MEDFLOW_KEY);
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