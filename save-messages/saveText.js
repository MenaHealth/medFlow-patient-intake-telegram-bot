// save-messages/saveText.js

import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

dotenv.config();const API_BASE_URL = process.env.API_BASE_URL;


export async function saveText(telegramChatId, text, sender = "patient", timestamp = new Date(), medflowKey) {
    console.log(`[DEBUG] Saving message for chat ID ${telegramChatId}: "${text}"`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
            },
            body: JSON.stringify({
                text,
                sender,
                timestamp,
                type: "text", // Add the type explicitly
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