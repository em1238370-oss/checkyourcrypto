# Crypto Academy Backend

API-сервер на Express, который:

- проверяет бесплатный период и подписку пользователя,
- проксирует запросы к Mistral AI,
- создаёт счета в Apirone (USDT/TRC20 и другие монеты),
- обрабатывает callback от Apirone и активирует подписки.

## Быстрый старт

```bash
cd backend
npm install
cp .env.example .env        # заполните реальными ключами
npm run dev
```

Сервер по умолчанию стартует на `http://localhost:4000`.

### Маршруты

- `GET /api/status?userId=...` — получить информацию о бесплатном периоде и подписке.
- `POST /api/chat` — запрос к чату. Тело: `{ userId, question }`.
- `POST /api/payments/apirone/invoice` — создать счёт на оплату через Apirone. Тело: `{ userId }`.
- `POST /api/payments/apirone/callback` — callback от Apirone (укажите этот URL в настройках кошелька).

> ⚠️ **Важно:** не храните реальные ключи в репозитории. Значения из `.env.example` нужны только как подсказка.

