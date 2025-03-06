// save-messages/saveText.js

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

export async function saveText(telegramChatId, text, sender = "patient", timestamp = new Date(), medflowKey) {
    console.log(`[DEBUG] Saving message for chat ID ${telegramChatId}: "${text}"`);

    if (!telegramChatId || !text || !sender) {
        console.error(`[ERROR] Missing required fields: chatId=${telegramChatId}, text=${text}, sender=${sender}`);
        throw new Error("Missing required fields: telegramChatId, text, sender");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
            },
            body: JSON.stringify({
                telegramChatId,
                text,
                sender,
                timestamp: new Date(timestamp).toISOString(), // Convert timestamp to ISO string
                type: "text", // Ensure type is included
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR] Failed to save message for chat ID ${telegramChatId}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[INFO] Message saved successfully for chat ID ${telegramChatId}:`, data);
        return data;
    } catch (error) {
        console.error(`[ERROR] Failed to save message for chat ID ${telegramChatId}:`, error);
        throw error;
    }
}