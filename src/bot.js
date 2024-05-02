const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { exec } = require('child_process');

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("Бот запущен и начинает обработку сообщений...");

function createConfirmationKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Подтвердить', callback_data: 'confirm' }],
                [{ text: 'Отмена', callback_data: 'cancel' }]
            ]
        }
    };
}

function createMainMenu() {
    return {
        reply_markup: {
            keyboard: [[{ text: "Перезагрузка серверов" }]],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`Пользователь с ID ${chatId} запустил бота.`);
    bot.sendMessage(chatId, 'Выберите действие:', createMainMenu());
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Получено сообщение от пользователя ${chatId}: ${msg.text}`);
    if (msg.text === "Перезагрузка серверов") {
        bot.sendMessage(chatId, 'Вы уверены, что хотите перезагрузить сервера?', createConfirmationKeyboard());
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    console.log(`Пользователь ${chatId} выбрал: ${query.data}`);

    if (query.data === 'confirm') {
        const servers = [
            { host: process.env.SERVER_1_HOST, username: process.env.SERVER_1_USERNAME, password: process.env.SERVER_1_PASSWORD },
            // Добавьте другие серверы по аналогии
        ];

        for (const server of servers) {
            console.log(`Начинаю процесс перезагрузки сервера: ${server.host}`);
            await rebootServer(server, chatId);
        }

        console.log("Все серверы успешно перезагружены.");
        bot.sendMessage(chatId, 'Перезагрузка всех серверов завершена', createMainMenu());
    } else if (query.data === 'cancel') {
        bot.deleteMessage(chatId, messageId);
        console.log(`Перезагрузка отменена пользователем ${chatId}.`);
        bot.sendMessage(chatId, 'Перезагрузка серверов отменена', createMainMenu());
    }
});

async function rebootServer(server, chatId) {
    try {
        const command = `python3 reboot_server.py "${server.host}" "${server.username}" "${server.password}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Ошибка при перезагрузке сервера ${server.host}:`, error);
                bot.sendMessage(chatId, `Ошибка при перезагрузке сервера ${server.host}: ${error.message}`);
                return;
            }
            console.log(`Сервер ${server.host} успешно перезагружается.`);
            bot.sendMessage(chatId, `Сервер ${server.host} успешно перезагружается.`);
        });
    } catch (error) {
        console.error(`Неустранимая ошибка: ${error}`);
        bot.sendMessage(chatId, `Критическая ошибка при выполнении скрипта: ${error.message}`);
    }
}

bot.on('polling_error', (error) => {
    console.error('Ошибка polling:', error);
});
