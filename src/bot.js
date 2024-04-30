const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const winrm = require('nodejs-winrm');

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

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
    bot.sendMessage(chatId, 'Выберите действие:', createMainMenu());
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === "Перезагрузка серверов") {
        bot.sendMessage(chatId, 'Вы уверены, что хотите перезагрузить сервера?', createConfirmationKeyboard());
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (query.data === 'confirm') {
        try {
            const servers = [
                { host: process.env.SERVER_1_HOST, username: process.env.SERVER_1_USERNAME, password: process.env.SERVER_1_PASSWORD },
                // Добавьте другие серверы по аналогии
            ];

            for (const server of servers) {
                await rebootServer(server, chatId);
            }

            bot.sendMessage(chatId, 'Перезагрузка всех серверов завершена', createMainMenu());
        } catch (error) {
            console.error('Ошибка при перезагрузке сервера:', error);
        }
    } else if (query.data === 'cancel') {
        bot.deleteMessage(chatId, messageId);
        bot.sendMessage(chatId, 'Перезагрузка серверов отменена', createMainMenu());
    }
});

async function rebootServer(server, chatId) {
    try {
        const auth = 'Basic ' + Buffer.from(`${server.username}:${server.password}`).toString('base64');
        const params = {
            host: server.host,
            port: 5985,
            path: '/wsman',
            auth: auth
        };

        params['shellId'] = await winrm.shell.doCreateShell(params);
        params['command'] = 'shutdown /r /t 0';
        params['commandId'] = await winrm.command.doExecuteCommand(params);
        const result = await winrm.command.doReceiveOutput(params);

        await winrm.shell.doDeleteShell(params);

        bot.sendMessage(chatId, `Сервер ${server.host} успешно перезагружается.`);
    } catch (error) {
        bot.sendMessage(chatId, `Ошибка при перезагрузке сервера ${server.host}: ${error.message}`);
        console.error(`Ошибка при перезагрузке сервера ${server.host}:`, error);
        throw error;
    }
}

bot.on('polling_error', (error) => {
    console.error('Ошибка polling:', error);
});
