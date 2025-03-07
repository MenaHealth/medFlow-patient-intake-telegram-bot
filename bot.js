// bot.js

import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { saveTelegramThread } from "./saveTelegramThread.js";
import { createPatient } from "./createPatient.js";
import { saveText } from "./save-messages/saveText.js";
import { saveAudio } from "./save-messages/saveAudio.js";
import { saveImage } from "./save-messages/saveImages.js";

dotenv.config();

// Load environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const MEDFLOW_KEY = process.env.MEDFLOW_KEY;

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

// Function to notify MedFlow app (sender field is always added)
async function notifyMedFlowApp(chatId, messageType, messageDetails) {
    try {
        // Ensure the sender field is present
        if (!messageDetails.sender) {
            messageDetails.sender = "patient";
        }
        const notificationResponse = await fetch(
            `${process.env.API_BASE_URL}/api/telegram-bot/${chatId}/save-message`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.MEDFLOW_KEY}`,
                },
                body: JSON.stringify({
                    type: messageType,
                    ...messageDetails,
                }),
            }
        );
        const notificationData = await notificationResponse.json();
        console.log("[INFO] Message processed by MedFlow app", notificationData);
    } catch (error) {
        console.error("[ERROR] Failed to notify MedFlow app:", error);
    }
}

// Handle incoming messages
bot.on("message", async (msg) => {
    const chatId = msg.chat.id.toString();
    const timestamp = new Date();

    // Update or create the Telegram thread for every message
    try {
        await saveTelegramThread(chatId, "en", MEDFLOW_KEY);
    } catch (error) {
        console.error(`[ERROR] Failed to save Telegram thread for chat ID ${chatId}:`, error);
    }

    // Process image messages
    if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const caption = msg.caption?.trim() || "";
        try {
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;
            console.log(`[INFO] Received image message for chat ID ${chatId}: ${fileUrl}, caption: "${caption}"`);

            await saveImage(chatId, fileUrl, "patient", timestamp, caption, MEDFLOW_KEY);

            const messageDetails = {
                sender: "patient",
                text: caption,
                mediaUrl: fileUrl,
                timestamp,
            };

            await notifyMedFlowApp(chatId, "image", messageDetails);
        } catch (error) {
            console.error(`[ERROR] Failed to process image message for chat ID ${chatId}:`, error);
        }
        return;
    }

    // Process audio/voice messages
    if (msg.audio || msg.voice) {
        const fileId = msg.audio?.file_id || msg.voice?.file_id;
        try {
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;
            console.log(`[INFO] Received audio message for chat ID ${chatId}: ${fileUrl}`);

            await saveAudio(chatId, fileUrl, "patient", timestamp, MEDFLOW_KEY);

            const messageDetails = {
                sender: "patient",
                text: "",
                mediaUrl: fileUrl,
                timestamp,
            };

            await notifyMedFlowApp(chatId, "audio", messageDetails);
        } catch (error) {
            console.error(`[ERROR] Failed to process audio message for chat ID ${chatId}:`, error);
        }
        return;
    }

    // Process text messages
    if (msg.text) {
        const text = msg.text.trim();

        // Check if text is a valid language selection
        const validLanguageSelections = {
            "1": "English",
            "2": "Arabic",
            "3": "Farsi",
            "4": "Pashto",
        };

        if (validLanguageSelections[text]) {
            const selectedLanguage = validLanguageSelections[text];
            console.log(`[INFO] Received language selection "${selectedLanguage}" for chat ID ${chatId}`);
            try {
                await createPatient(chatId, selectedLanguage, MEDFLOW_KEY);
                // No need to send a confirmation message here
            } catch (error) {
                console.error(`[ERROR] Failed to update patient language for chat ID ${chatId}:`, error);
                await bot.sendMessage(chatId, "An error occurred while setting your language. Please try again later.");
            }
            return;
        }

        // Otherwise, treat the text as a normal message
        try {
            const messageDetails = {
                sender: "patient",
                text,
                mediaUrl: "",
                timestamp,
            };
            // Use a single endpoint call to save the message
            await notifyMedFlowApp(chatId, "text", messageDetails);
        } catch (error) {
            console.error(`[ERROR] Failed to process text message for chat ID ${chatId}:`, error);
        }
    }

    console.log(`[DEBUG] Processed message from chat ID ${chatId}.`);
});