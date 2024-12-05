// saveTelegramThread.js

import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();const API_BASE_URL = process.env.API_BASE_URL;


// Function to save a Telegram thread to the API
export async function saveTelegramThread(telegramChatId, language = "en", medflowKey) {
    console.log(`[DEBUG] Saving Telegram thread for chat ID ${telegramChatId} with language "${language}"`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/new-thread`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
            },
            body: JSON.stringify({ telegramChatId, language }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR] Failed to save Telegram thread:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[INFO] Telegram thread saved successfully:`, data);
        return data;
    } catch (error) {
        console.error(`[ERROR] Failed to save Telegram thread:`, error);
        throw error;
    }
}