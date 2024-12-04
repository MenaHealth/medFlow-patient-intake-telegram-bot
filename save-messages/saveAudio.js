    // save-messages/saveAudio.js
import dotenv from "dotenv";
dotenv.config(); // Load environment variables
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";

// Base URL for the API
const API_BASE_URL = process.env.NODE_ENV === "development"
    ? process.env.DEV_PATIENT_FORM_BASE_URL || "http://localhost:3000"
    : process.env.PATIENT_FORM_BASE_URL || "https://medflow-mena-health.vercel.app";

// Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Function to upload audio to S3
async function uploadAudioToS3(chatId, buffer, timestamp) {
    const key = `audio/${chatId}/${timestamp.toISOString()}.ogg`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_AUDIO_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "audio/ogg",
        });

        await s3.send(command);
        const location = `https://${process.env.AWS_S3_AUDIO_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`[INFO] Audio uploaded to S3: ${location}`);
        return location;
    } catch (error) {
        console.error(`[ERROR] Failed to upload audio to S3:`, error);
        throw error;
    }
}

// Function to save the audio message
export async function saveAudio(telegramChatId, fileUrl, sender = "patient", timestamp = new Date()) {
    console.log(`[DEBUG] Saving audio message for chat ID ${telegramChatId}`);

    try {
        // Fetch the audio file from Telegram
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch audio file from Telegram");
        }
        const buffer = Buffer.from(await response.arrayBuffer());

        // Upload the file to S3
        const s3Url = await uploadAudioToS3(telegramChatId, buffer, timestamp);

        // Send the S3 URL to the API
        const apiKey = process.env.NODE_ENV === "development"
            ? process.env.DEV_TELEGRAM_BOT_KEY
            : process.env.PROD_TELEGRAM_BOT_KEY;

        const responseFromAPI = await fetch(
            `${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${encodeURIComponent(apiKey)}`,
                },
                body: JSON.stringify({
                    text: "Audio Message", // Placeholder text for audio messages
                    sender,
                    timestamp,
                    type: "audio",
                    mediaUrl: s3Url, // Pass the S3 URL as mediaUrl
                }),
            }
        );

        if (!responseFromAPI.ok) {
            const errorText = await responseFromAPI.text();
            console.error(`[ERROR] Failed to save audio message for chat ID ${telegramChatId}:`, errorText);
            throw new Error(`HTTP error! status: ${responseFromAPI.status}`);
        }

        const data = await responseFromAPI.json();
        console.log(`[INFO] Audio message saved successfully for chat ID ${telegramChatId}:`, data);
        return data;
    } catch (error) {
        console.error(`[ERROR] Failed to save audio message for chat ID ${telegramChatId}:`, error);
        throw error;
    }
}