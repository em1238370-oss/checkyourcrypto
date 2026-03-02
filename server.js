   import express from 'express';
   import cors from 'cors';
   import cron from 'node-cron';
   import axios from 'axios';
   import { Resend } from 'resend';
   import dotenv from 'dotenv';

   dotenv.config();

   const app = express();
   app.use(cors());
   app.use(express.json());

   const resend = new Resend(process.env.RESEND_API_KEY);
   const portfolioStore = new Map();

   const symbolMap = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', ADA: 'cardano', DOT: 'polkadot' };
   const toCoinId = symbol => symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();

   app.post('/add_portfolio', (req, res) => {
     const { email, coin, quantity, buy_price, up_alerts = [3], down_alerts = [3] } = req.body;

     if (!email || !coin || !quantity || !buy_price) {
       return res.status(400).json({ message: 'Missing required fields' });
     }

     const coinId = toCoinId(coin);
     const entry = {
       coinId,
       quantity,
       buyPrice: Number(buy_price),
       thresholds: { up: up_alerts, down: down_alerts },
     };

     const userAssets = portfolioStore.get(email) || [];
     userAssets.push(entry);
     portfolioStore.set(email, userAssets);

     res.json({ message: 'Portfolio saved' });
   });

   cron.schedule('*/5 * * * *', async () => {
     console.log('Checking prices ...', new Date().toLocaleTimeString());

     for (const [email, assets] of portfolioStore.entries()) {
       const ids = [...new Set(assets.map(a => a.coinId))].join(',');
       if (!ids) continue;

       try {
         const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
           params: { ids, vs_currencies: 'usd' },
         });

         const alerts = [];

         assets.forEach(asset => {
           const current = data[asset.coinId]?.usd;
           if (!current) return;

           const changePct = ((current - asset.buyPrice) / asset.buyPrice) * 100;
           const hitUp = asset.thresholds.up.some(t => changePct >= t);
           const hitDown = asset.thresholds.down.some(t => changePct <= -t);

           if (hitUp || hitDown) {
             alerts.push({
               coinId: asset.coinId,
               current,
               changePct: changePct.toFixed(2),
               direction: hitUp ? 'rise' : 'drop',
             });
           }
         });

         if (alerts.length) {
           await sendEmail(email, alerts);
         }
       } catch (err) {
         console.error('Price fetch failed:', err.message);
       }
     }
   });

   async function sendEmail(email, alerts) {
     const lines = alerts
       .map(
         a =>
           `${a.coinId.toUpperCase()}: ${a.direction === 'rise' ? '▲' : '▼'} ${a.changePct}% (текущая цена $${a.current})`
       )
       .join('<br>');

     const advice =
       alerts[0].direction === 'rise'
         ? 'Рост сильный — подумай о частичной фиксации и переносе стопов.'
         : 'Падение заметное — проверь новости и будь осторожен с эмоциями.';

     await resend.emails.send({
       from: process.env.FROM_EMAIL,
       to: email,
       subject: '📈 Crypto Coach: ценовой сигнал',
       html: `
         <h2>Сигналы по портфелю</h2>
         <p>${lines}</p>
         <p><strong>Совет:</strong> ${advice}</p>
         <p style="font-size:12px;color:#999">Автоуведомление • чтобы остановить — ответь STOP</p>
       `,
     });
   }

   const port = process.env.PORT || 5000;
   app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
   ```

2. Проверь `.env`, чтобы там были:

   ```
   PORT=5000
   RESEND_API_KEY=твой_ключ
   FROM_EMAIL=Crypto Coach <alerts@твойдомен.com>
   ```

3. В терминале снова из папки проекта запусти `npm start`. Теперь сервер найдёт `server.js` и запустится.

4. Пока терминал открыт и сервер работает, открой HTML/JS модуль — он будет слать запросы на `http://localhost:5000/add_portfolio`. Всё бесплатно, так как backend крутится локально и CoinGecko + Resend имеют бесплатные квоты.