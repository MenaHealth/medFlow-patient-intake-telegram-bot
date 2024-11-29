import dotenv from 'dotenv';
import { createOrGetPatient } from './API.js';

dotenv.config(); // Load environment variables from .env

async function testTelegramAPI() {
    try {
        const response = await createOrGetPatient('12345', 'John Doe');
        console.log('Test Response:', response);
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testTelegramAPI();