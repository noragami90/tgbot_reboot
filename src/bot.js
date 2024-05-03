const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { NodeSSH } = require('node-ssh');
const { Client } = require('ssh2');

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
    const messageId = query.message.message_id;
    console.log(`Пользователь ${chatId} выбрал: ${query.data}`);

    if (query.data === 'confirm') {
        const servers = [
            { host: process.env.SERVER_1_HOST, username: process.env.SERVER_1_USERNAME, password: process.env.SERVER_1_PASSWORD },
            { host: process.env.SERVER_2_HOST, username: process.env.SERVER_2_USERNAME, password: process.env.SERVER_2_PASSWORD },
            // Добавьте другие серверы по аналогии
        ];

        for (const server of servers) {
            console.log(`Начинаю процесс перезагрузки сервера: ${server.host}`);
            await rebootServer(server, chatId);
        }

        console.log("Все серверы успешно перезагружены.");
        bot.sendMessage(chatId, 'Перезагрузка всех серверов', createMainMenu());
    } else if (query.data === 'cancel') {
        bot.deleteMessage(chatId, messageId);
        console.log(`Перезагрузка отменена пользователем ${chatId}.`);
        bot.sendMessage(chatId, 'Перезагрузка серверов отменена', createMainMenu());
    }
});

async function rebootServer(server, chatId) {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH Client Ready');
        conn.exec('shutdown /r /t 30', (err, stream) => {
            if (err) {
                console.error('Ошибка выполнения команды:', err);
                bot.sendMessage(chatId, `Ошибка при отправке команды перезагрузки на сервер ${server.host}: ${err.message}`);
                return;
            }
            stream.on('close', () => {
                console.log(`Команда перезагрузки отправлена на сервер ${server.host}.`);
                bot.sendMessage(chatId, `Сервер ${server.host} будет перезагружен через 30 секунд.`);
                conn.end(); // Закрываем соединение после отправки команды
            }).on('data', (data) => {
                console.log('STDOUT:', data.toString());
            }).stderr.on('data', (data) => {
                console.log('STDERR:', data.toString());
            });
        });
    }).on('error', (err) => {
        console.log('Ошибка SSH соединения:', err);
        if (err.code === 'ECONNRESET') {
            bot.sendMessage(chatId, `Соединение с сервером ${server.host} было сброшено, перезагрузка запланирована.`);
        } else {
            bot.sendMessage(chatId, `Ошибка соединения с сервером ${server.host}: ${err.message}`);
        }
    }).connect({
        host: server.host,
        port: 22,
        username: server.username,
        password: server.password
    });
}

bot.on('polling_error', (error) => {
    console.error('Ошибка polling:', error);
});
