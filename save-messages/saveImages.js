// save-messages/saveImages.js

import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const spacesClient = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

async function uploadImageToSpaces(chatId, imageBuffer, uploadTimestamp) {
    const folder = process.env.NODE_ENV === "development" ? "dev" : "prod";
    const filePath = `${folder}/images/${chatId}/${uploadTimestamp.toISOString()}.jpg`;

    try {
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filePath,
            Body: imageBuffer,
            ContentType: "image/jpeg",
        });

        await spacesClient.send(uploadCommand);
        const fileUrl = `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${filePath}`;
        console.log(`[INFO] Image uploaded to: ${fileUrl}`);
        return fileUrl;
    } catch (uploadError) {
        console.error(`[ERROR] Image upload failed:`, uploadError);
        throw uploadError;
    }
}

export async function saveImage(chatId, telegramFileUrl, sender = "patient", uploadTimestamp = new Date(), caption = "") {
    console.log(`[DEBUG] Preparing to save image for chat ID ${chatId}`);

    try {
        const imageResponse = await axios.get(telegramFileUrl, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(imageResponse.data);
        const imageUrl = await uploadImageToSpaces(chatId, imageBuffer, uploadTimestamp);

        const botApiKey = process.env.TELEGRAM_BOT_TOKEN;

        const messagePayload = {
            text: caption || "Image Message",
            sender,
            timestamp: uploadTimestamp.toISOString(),
            type: "image",
            mediaUrl: imageUrl,
        };

        const apiResponse = await axios.patch(
            `${process.env.API_BASE_URL}/api/telegram-bot/${chatId}/save-message`,
            messagePayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${encodeURIComponent(botApiKey)}`,
                },
            }
        );

        console.log(`[INFO] Image saved for chat ID ${chatId}:`, apiResponse.data);
        return apiResponse.data;
    } catch (saveError) {
        console.error(`[ERROR] Failed to save image for chat ID ${chatId}:`, saveError);
        throw saveError;
    }
}