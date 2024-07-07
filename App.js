const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Telegraf, Markup } = require('telegraf');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = '7253315958:AAGDBGD28J0_Ud5-ruVbQhgI3xBp7qhdIPY';

// Initialize Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to receive updates from Telegram webhook
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

// Logging middleware
bot.use((ctx, next) => {
    console.log('Received update:', ctx.update);
    return next();
});

// Start bot commands and interactions
bot.start((ctx) => {
    ctx.reply('Welcome! Please type the retailer name.');
});

// Handle messages containing retailer name
let retailerNames = {}; // Store retailer names by chat ID
bot.on('text', (ctx) => {
    const chatId = ctx.chat.id;
    const retailerName = ctx.message.text;
    retailerNames[chatId] = retailerName;
    console.log(`Received retailer name: ${retailerName} from chat ID: ${chatId}`);
    ctx.reply(`Retailer name '${retailerName}' received. Please upload an image for this retailer.`);
});

// Handle photo uploads
bot.on('photo', async (ctx) => {
    const chatId = ctx.chat.id;
    const retailerName = retailerNames[chatId];
    if (!retailerName) {
        ctx.reply('Please enter the retailer name first.');
        return;
    }
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    await handleImageUpload(chatId, retailerName, fileId);
});

// Handle document uploads
bot.on('document', (ctx) => {
    ctx.reply('Received a document! Please upload images as photos, not documents.');
});

// Function to handle image uploads
async function handleImageUpload(chatId, retailerName, fileId) {
    try {
        const fileLink = await bot.telegram.getFileLink(fileId);
        console.log(`File link for ${retailerName}: ${fileLink}`);

        // Simulate saving image (replace with your actual logic)
        // For example, save it to a local directory
        const downloadDir = './images';
        const downloadPath = `${downloadDir}/${fileId}.jpg`;
        
        // Ensure the download directory exists
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        // Download the file from Telegram
        const file = fs.createWriteStream(downloadPath);
        https.get(fileLink.href, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                console.log('File downloaded successfully');

                // Notify user of successful upload
                bot.telegram.sendMessage(chatId, `Image uploaded for retailer: ${retailerName}`);
            });
        }).on('error', function(err) {
            console.error('Error downloading file:', err);
            bot.telegram.sendMessage(chatId, 'Sorry, there was an error uploading the image.');
        });
    } catch (error) {
        console.error('Error handling image upload:', error);
        await bot.telegram.sendMessage(chatId, 'Sorry, there was an error uploading the image.');
    }
}

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Set up the bot to use webhooks (if you have a public HTTPS URL)
// bot.telegram.setWebhook(`https://your-domain.com/bot${BOT_TOKEN}`);

// OR use long polling (easier for local development)
bot.launch();
