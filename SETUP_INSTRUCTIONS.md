# 📋 Инструкция по настройке проекта на новом компьютере

## 🔑 Важные данные для копирования

### 1. Файл `.env` в папке `backend/`

Создай файл `backend/.env` и вставь туда следующие данные:

```env
PORT=4000
FREE_TRIAL_HOURS=24
SUBSCRIPTION_PRICE_USD=10
SUBSCRIPTION_PERIOD_DAYS=30
APP_BASE_URL=http://localhost:4000

# Mistral AI
MISTRAL_API_KEY=qM0xeVPRdf6OOmT8KNRJPuZ59ZPCunvG

# CryptoCloud crypto payments
CRYPTOCLOUD_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiTnprd05UTT0iLCJ0eXBlIjoicHJvamVjdCIsInYiOiJiOTNkYTY2NjllM2ZiNGUyYWFhM2Y3ZDc5MTkxMjM3OWIxOGVmMmU0ZGU1MGNiZGFhNmFjZTRkMWNjOTEwNDgwIiwiZXhwIjo4ODE2MzczOTI1NH0.M3ivNXKyTXUOrX6vGJM5PxRf6T5Bfu-tuVC4-ZvePk0
CRYPTOCLOUD_SHOP_ID=nODfxuiWpW382gjV

# CloudPayments card payments (пока не настроено)
# CLOUDPAYMENTS_PUBLIC_ID=твой_public_id_здесь
# CLOUDPAYMENTS_API_SECRET=твой_api_secret_здесь
```

---

## 📦 Установка на новом компьютере

### Шаг 1: Установи Node.js
- Скачай с https://nodejs.org/
- Установи версию LTS (рекомендуется)

### Шаг 2: Открой терминал и перейди в папку проекта
```bash
cd ~/crypto-website
```

### Шаг 3: Установи зависимости для backend
```bash
cd backend
npm install
```

### Шаг 4: Создай файл `.env`
- Создай файл `backend/.env`
- Скопируй туда данные из раздела "Важные данные" выше

### Шаг 5: Запусти backend
```bash
npm run dev
```
Backend будет работать на `http://localhost:4000`

### Шаг 6: Запусти frontend (в другом терминале)
```bash
cd ~/crypto-website
python3 -m http.server 5500
```
Frontend будет доступен на `http://localhost:5500`

---

## ⚙️ Настройки проекта

### Таймер бесплатного периода
- **Время:** 24 часа (настраивается в `FREE_TRIAL_HOURS` в `.env`)
- **Отсчёт:** Начинается автоматически при первом открытии чата

### Цена подписки
- **Стоимость:** $10 USD в месяц
- **Период:** 30 дней (настраивается в `SUBSCRIPTION_PERIOD_DAYS` в `.env`)

### Способы оплаты
1. **Криптовалюта (USDT)** - работает через CryptoCloud ✅
2. **Банковская карта** - пока не настроено (ждём одобрения заявки)

---

## 🔧 Структура проекта

```
crypto-website/
├── backend/              # Backend сервер (Node.js)
│   ├── server.js         # Главный файл сервера
│   ├── .env              # ⚠️ ВАЖНО: Создай этот файл с данными выше
│   ├── package.json      # Зависимости Node.js
│   └── node_modules/     # Устанавливается через npm install
├── scripts/
│   └── chatbot.js        # Логика чата и оплаты
├── styles.css            # Стили сайта
├── index.html            # Главная страница
└── assets/               # Изображения и ресурсы
```

---

## 🚀 Команды для запуска

### Запуск backend (в терминале 1):
```bash
cd ~/crypto-website/backend
npm run dev
```

### Запуск frontend (в терминале 2):
```bash
cd ~/crypto-website
python3 -m http.server 5500
```

### Открыть сайт:
Перейди в браузере на: `http://localhost:5500`

---

## 📝 Важные заметки

1. **Файл `.env`** содержит секретные ключи - НЕ публикуй его в интернете!
2. **Backend должен быть запущен** перед использованием чата
3. **Порт 4000** используется для backend API
4. **Порт 5500** используется для frontend
5. Если что-то не работает, проверь:
   - Запущен ли backend (`npm run dev` в папке backend)
   - Запущен ли frontend сервер
   - Правильно ли заполнен файл `.env`

---

## 🐛 Решение проблем

### Backend не запускается:
```bash
cd backend
npm install  # Переустанови зависимости
npm run dev
```

### Ошибка "port already in use":
```bash
# Убей процесс на порту 4000
lsof -ti:4000 | xargs kill -9
```

### Чат не работает:
- Проверь, что backend запущен на порту 4000
- Открой консоль браузера (F12) и посмотри ошибки
- Проверь файл `.env` - все ключи должны быть заполнены

---

## 📞 Контакты для поддержки

Если что-то не работает, проверь:
1. Все файлы скопированы
2. `.env` файл создан и заполнен
3. `npm install` выполнен в папке backend
4. Backend и frontend запущены

---

**Дата создания:** 2024
**Версия проекта:** v1.0

---

## 📋 Быстрая копия всех настроек

### Файл `.env` (создай в папке `backend/.env`):

```
PORT=4000
FREE_TRIAL_HOURS=24
SUBSCRIPTION_PRICE_USD=10
SUBSCRIPTION_PERIOD_DAYS=30
APP_BASE_URL=http://localhost:4000

# Mistral AI
MISTRAL_API_KEY=qM0xeVPRdf6OOmT8KNRJPuZ59ZPCunvG

# CryptoCloud crypto payments
CRYPTOCLOUD_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiTnprd05UTT0iLCJ0eXBlIjoicHJvamVjdCIsInYiOiJiOTNkYTY2NjllM2ZiNGUyYWFhM2Y3ZDc5MTkxMjM3OWIxOGVmMmU0ZGU1MGNiZGFhNmFjZTRkMWNjOTEwNDgwIiwiZXhwIjo4ODE2MzczOTI1NH0.M3ivNXKyTXUOrX6vGJM5PxRf6T5Bfu-tuVC4-ZvePk0
CRYPTOCLOUD_SHOP_ID=nODfxuiWpW382gjV
```

**⚠️ ВАЖНО:** Скопируй этот блок полностью и вставь в файл `backend/.env` на новом компьютере!

