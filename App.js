const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Telegraf } = require('telegraf');

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
bot.on('text', (ctx) => {
    const retailerName = ctx.message.text;
    console.log(`Received retailer name: ${retailerName} from chat ID: ${ctx.chat.id}`);
    ctx.reply(`Retailer name '${retailerName}' received. Please upload an image for this retailer.`);
    // Store retailerName in your database or session here
});

// Handle photo uploads
bot.on('photo', async (ctx) => {
    const retailerName = 'LastRetailerName'; // You'll need to implement a way to store and retrieve this
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    await handleImageUpload(ctx.chat.id, retailerName, fileId);
});

// Handle document uploads
bot.on('document', (ctx) => {
    ctx.reply('Received a document! Please upload images as photos, not documents.');
});

// Function to handle image uploads
async function handleImageUpload(chatId, retailerName, fileId) {
    try {
        const fileLink = await bot.telegram.getFileLink(fileId);
        // Here you would typically download the file and upload it to your storage
        console.log(`File link for ${retailerName}: ${fileLink}`);
        await bot.telegram.sendMessage(chatId, `Image uploaded for retailer: ${retailerName}`);
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
