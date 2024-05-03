# Инструкция по запуску бота для перезагрузки серверов.
Этот бот предоставляет возможность перезагружать удаленные серверы с помощью Telegram. 

Для работы бота требуются учетные данные для доступа к хостам по протоколу SSH.

# Установка и настройка

Установите Docker на сервер где будет запускаться бот.

 $ curl -fsSL https://get.docker.com -o get-docker.sh
 
 $ sudo sh ./get-docker.sh

# Настройте переменные окружения
Создайте файл .env в корне проекта и укажите в нем следующие переменные окружения:

TELEGRAM_TOKEN=Токен для Telegram бота

SERVER_1_HOST=

SERVER_1_USERNAME='домен\пользователь'

SERVER_1_PASSWORD=''

Добавьте переменные для других серверов по аналогии

В файле bot.js необходимо добавить новые сервера:

{ host: process.env.SERVER_1_HOST, username: process.env.SERVER_1_USERNAME, password: process.env.SERVER_1_PASSWORD },

//Добавьте другие серверы по аналогии

# Запуск бота
Выполните следующую команду:

$ docker compose up -d

# Настройка хостов

# Установите на сервер OpenSSH Server 

https://github.com/PowerShell/Win32-OpenSSH/releases/download/v9.5.0.0p1-Beta/OpenSSH-Win64-v9.5.0.0.msi
