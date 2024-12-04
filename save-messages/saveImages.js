    // save-messages/saveImages.js

import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

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

// Function to upload an image to S3
async function uploadImageToS3(chatId, buffer, timestamp) {
    const key = `images/${chatId}/${timestamp.toISOString()}.jpg`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_IMAGE_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "image/jpeg",
        });

        await s3.send(command);
        const location = `https://${process.env.AWS_S3_IMAGE_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`[INFO] Image uploaded to S3: ${location}`);
        return location;
    } catch (error) {
        console.error(`[ERROR] Failed to upload image to S3:`, error);
        throw error;
    }
}

// Function to save the image message
export async function saveImage(telegramChatId, fileUrl, sender = "patient", timestamp = new Date(), caption = "") {
    console.log(`[DEBUG] Saving image message for chat ID ${telegramChatId}`);

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const s3Url = await uploadImageToS3(telegramChatId, buffer, timestamp);

        const apiKey = process.env.NODE_ENV === "development"
            ? process.env.DEV_TELEGRAM_BOT_KEY
            : process.env.PROD_TELEGRAM_BOT_KEY;

        const requestBody = {
            text: caption || "Image Message",
            sender,
            timestamp: timestamp.toISOString(),
            type: "image",
            mediaUrl: s3Url,
        };

        const responseFromAPI = await axios.patch(
            `${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`,
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${encodeURIComponent(apiKey)}`,
                },
            }
        );

        console.log(`[INFO] Image message saved successfully for chat ID ${telegramChatId}:`, responseFromAPI.data);
        return responseFromAPI.data;
    } catch (error) {
        console.error(`[ERROR] Failed to save image message for chat ID ${telegramChatId}:`, error);
        throw error;
    }
}

