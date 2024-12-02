// saveMessage.js


import fetch from 'node-fetch';

// Base URL for the API
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? process.env.DEV_PATIENT_FORM_BASE_URL || 'http://localhost:3000'
    : process.env.PATIENT_FORM_BASE_URL || 'https://medflow-mena-health.vercel.app';

// Function to save a message to the API
export async function saveMessage(telegramChatId, text, sender = 'patient', timestamp = new Date()) {
    console.log(`[DEBUG] Saving message for chat ID ${telegramChatId}: "${text}"`);

    try {
        const apiKey = process.env.NODE_ENV === 'development'
            ? process.env.DEV_TELEGRAM_BOT_KEY
            : process.env.PROD_TELEGRAM_BOT_KEY;

        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${encodeURIComponent(apiKey)}`,
            },
            body: JSON.stringify({ text, sender, timestamp }),
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