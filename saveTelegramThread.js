// saveTelegramThread.js

import fetch from "node-fetch";

const API_BASE_URL = process.env.NODE_ENV === "development"
    ? process.env.DEV_PATIENT_FORM_BASE_URL || "http://localhost:3000"
    : process.env.PATIENT_FORM_BASE_URL || "https://medflow-mena-health.vercel.app";

// Function to save a Telegram thread to the API
export async function saveTelegramThread(telegramChatId, language = "en") {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/new-thread`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ telegramChatId, language }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR] Failed to save Telegram thread:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[INFO] Telegram thread saved:`, data);
        return data;
    } catch (error) {
        console.error(`[ERROR] Failed to save Telegram thread:`, error);
        throw error;
    }
}