# Деплой Чатикса — пошаговая инструкция

## Что нужно
- VPS с Ubuntu 22.04 (минимум 1 CPU / 1 GB RAM — хватит на группу)
- Домен, привязанный к IP сервера
- 30–40 минут времени

Рекомендую **Timeweb Cloud**, **Selectel** или **Hetzner** — 5–7 € в месяц достаточно.

---

## Шаг 1 — Подготовка сервера

Подключись по SSH и выполни:

```bash
# Обновление
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose
sudo apt install -y docker-compose-plugin

# Проверка
docker --version
docker compose version
```

---

## Шаг 2 — Загрузка проекта на сервер

**Вариант А — через Git (рекомендую):**
```bash
# Создай приватный репозиторий на GitHub/GitLab, залей туда папку chatix/
git clone https://github.com/твой-юзер/chatix.git
cd chatix
```

**Вариант Б — через scp с локальной машины:**
```bash
# Выполни на своём компьютере:
scp -r ./chatix user@IP_СЕРВЕРА:~/chatix
# Затем зайди на сервер и:
cd ~/chatix
```

---

## Шаг 3 — Настройка переменных окружения

```bash
cp .env.example .env
nano .env
```

Заполни все поля:
```env
DB_PASSWORD=ВотТутНадёжныйПарольДляБД_!2024
JWT_SECRET=минимум32случайныхсимвола1234567890abcdef
JWT_REFRESH_SECRET=ещёОдин32символьныйКлюч9876543210qwerty
CLIENT_URL=https://chatix.твой-домен.ru
ADMIN_EMAIL=твой@email.ru
ADMIN_PASSWORD=ПарольАдмина!123
```

> **Генерация секретных ключей:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Запусти дважды — для JWT_SECRET и JWT_REFRESH_SECRET.

---

## Шаг 4 — Настройка домена и HTTPS (Nginx + Certbot)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Создай конфиг
sudo nano /etc/nginx/sites-available/chatix
```

Вставь:
```nginx
server {
    listen 80;
    server_name chatix.твой-домен.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:4000/uploads/;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Активируй и проверь
sudo ln -s /etc/nginx/sites-available/chatix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL сертификат (бесплатно Let's Encrypt)
sudo certbot --nginx -d chatix.твой-домен.ru
# Следуй инструкциям, выбери "Redirect" когда спросит
```

---

## Шаг 5 — Запуск

```bash
cd ~/chatix

# Сборка и запуск
docker compose up -d --build

# Следи за логами
docker compose logs -f backend
```

При первом запуске Docker автоматически:
1. Создаст базу данных
2. Запустит миграции (создаст все таблицы)
3. Создаст аккаунт администратора (твой email из .env)
4. Создаст чаты «Общий», «Подгруппа 1», «Подгруппа 2»

---

## Шаг 6 — Проверка

```bash
# Статус контейнеров (все должны быть Up)
docker compose ps

# Проверка API
curl http://localhost:4000/health
# Должно вернуть: {"status":"ok","time":"..."}
```

Открой в браузере: `https://chatix.твой-домен.ru`

Войди с данными из `.env` (ADMIN_EMAIL + ADMIN_PASSWORD).

---

## Управление пользователями

Когда одногруппник зарегистрируется, зайди в **Админку** (кнопка в сайдбаре).

Там увидишь заявку — выбери в какую подгруппу добавить и нажми кнопку.
Пользователь сразу получит доступ и попадёт в нужные чаты.

---

## Обновление проекта

```bash
cd ~/chatix
git pull              # если используешь Git
docker compose down
docker compose up -d --build
```

---

## Резервное копирование БД

```bash
# Создать бэкап
docker compose exec db pg_dump -U chatix_user chatix_db > backup_$(date +%Y%m%d).sql

# Восстановить
cat backup_20241201.sql | docker compose exec -T db psql -U chatix_user chatix_db
```

Добавь в cron (автобэкап каждый день в 3:00):
```bash
crontab -e
# Добавь строку:
0 3 * * * cd ~/chatix && docker compose exec -T db pg_dump -U chatix_user chatix_db > ~/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Полезные команды

```bash
# Посмотреть логи бэкенда
docker compose logs -f backend

# Перезапустить только бэкенд
docker compose restart backend

# Зайти в базу данных
docker compose exec db psql -U chatix_user chatix_db

# Посмотреть занятое место
docker system df
```

---

## Структура проекта

```
chatix/
├── backend/              # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── index.js      # Точка входа
│   │   ├── config/db.js  # Подключение к PostgreSQL
│   │   ├── controllers/  # Логика (auth, chats, messages, admin)
│   │   ├── middleware/   # JWT-авторизация, rate limiting, валидация
│   │   ├── models/       # Миграции и seed
│   │   ├── routes/       # API маршруты
│   │   └── socket/       # WebSocket-обработчики
│   └── Dockerfile
├── frontend/             # React + Vite + Zustand
│   ├── src/
│   │   ├── components/   # UI компоненты (чат, сайдбар, профиль)
│   │   ├── pages/        # Страницы (Login, Register, Chat, Admin)
│   │   ├── store/        # Глобальное состояние (Zustand)
│   │   └── utils/        # API-клиент, Socket.IO, форматирование
│   └── Dockerfile
├── docker-compose.yml    # Оркестрация контейнеров
├── .env.example          # Пример переменных окружения
└── DEPLOY.md             # Эта инструкция
```

---

## Безопасность

- Пароли хешируются через **bcrypt** (cost factor 12)
- Аутентификация: **JWT access token** (15 мин) + **refresh token** (30 дней)
- Refresh токены хранятся в БД как SHA-256 хеш — утечка токена не даёт доступ
- Смена пароля инвалидирует все refresh токены (все сессии слетают)
- Rate limiting: 20 попыток входа / 15 мин, 200 запросов API / мин
- WebSocket защищён тем же JWT
- HTTPS через Let's Encrypt (TLS 1.2/1.3)
- Helmet.js — безопасные HTTP-заголовки
- Валидация всех входящих данных через express-validator

