// bot.js

import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { languagePromptMessage } from "./utils/languagePrompt.js";
import { saveTelegramThread } from "./saveTelegramThread.js";
import { createPatient } from "./createPatient.js";
import { saveText } from "./save-messages/saveText.js";
import { saveAudio } from "./save-messages/saveAudio.js";
import { saveImage } from "./save-messages/saveImages.js";
import { sendEmailNotification } from "./send-email-notification.js";

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

// Function to notify MedFlow app
async function notifyMedFlowApp(chatId, messageType, messageDetails) {
    try {
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
        if (notificationData.thread?.user_emails?.length) {
            console.log("[INFO] Notifying user emails:", notificationData.thread.user_emails);
            await sendEmailNotification(notificationData.thread.user_emails, messageDetails);
        } else {
            console.log("[INFO] No user emails found for notification.");
        }
    } catch (error) {
        console.error("[ERROR] Failed to notify MedFlow app or send email:", error);
    }
}

// Handle incoming messages
bot.on("message", async (msg) => {
    const chatId = msg.chat.id.toString();
    const timestamp = new Date();

    // Always attempt to save/update the Telegram thread.
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
                type: "image",
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
                type: "audio",
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

        // Check if the text is a valid language selection.
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
                // Optionally, send a confirmation message to the user.
                await bot.sendMessage(chatId, `Language set to ${selectedLanguage}.`);
            } catch (error) {
                console.error(`[ERROR] Failed to update patient language for chat ID ${chatId}:`, error);
                await bot.sendMessage(chatId, "An error occurred while setting your language. Please try again later.");
            }
            return;
        }

        // Otherwise, treat the text as a regular message.
        try {
            await saveText(chatId, text, "patient", timestamp, MEDFLOW_KEY);
            const messageDetails = {
                type: "text",
                text,
                mediaUrl: "",
                timestamp,
            };
            await notifyMedFlowApp(chatId, "text", messageDetails);
        } catch (error) {
            console.error(`[ERROR] Failed to save text message for chat ID ${chatId}:`, error);
        }
    }

    console.log(`[DEBUG] Processed message from chat ID ${chatId}.`);
});