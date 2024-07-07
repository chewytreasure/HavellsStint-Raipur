const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs/promises'); // Using fs.promises for async file operations

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';

// Initialize Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const fileLink = await bot.telegram.getFileLink(fileId);
    await handleImageUpload(ctx.chat.id, retailerName, fileLink);
});

// Function to handle image uploads
async function handleImageUpload(chatId, retailerName, fileLink) {
    try {
        const timestamp = Date.now(); // Use timestamp to make filename unique
        const fileExtension = path.extname(fileLink);
        const filename = `${retailerName}-${timestamp}${fileExtension}`;
        const destination = path.join(__dirname, 'uploads', filename);

        // Download the file from Telegram and save it locally
        const response = await axios({
            method: 'GET',
            url: fileLink,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(destination);
        response.data.pipe(writer);

        // Event on finish of download
        writer.on('finish', async () => {
            console.log(`File downloaded successfully: ${filename}`);
            await bot.telegram.sendMessage(chatId, `Image uploaded for retailer: ${retailerName}`);
        });

        // Event on error during download
        writer.on('error', (err) => {
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
