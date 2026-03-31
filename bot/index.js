require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ── WhatsApp helper ──────────────────────────────────────────────
const WA_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendText(to, text) {
  await axios.post(WA_URL, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  }, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

// ── Session store (in-memory) ────────────────────────────────────
const sessions = {};
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

async function handleMessage({ from, text }) {
  const input = (text || '').trim();
  const session = sessions[from] || { step: 'IDLE' };

  console.log(`[${from}] step=${session.step} input="${input}"`);

  if (session.step === 'IDLE') {
    sessions[from] = { step: 'WAIT_CODE' };
    await sendText(from,
      '¡Hola! Bienvenido a la campaña *Sporade x DGo Raspa y Gana* 🎉\n\nPor favor, envíame el *código* que aparece en tu tarjeta raspadito.'
    );
    return;
  }

  if (session.step === 'WAIT_CODE') {
    const code = input.toUpperCase();
    try {
      const { data } = await axios.post(`${API_URL}/redemptions/validate-code`, { code });
      if (!data.valid) {
        await sendText(from, `❌ El código *${code}* no es válido o ya fue utilizado. Verifica e intenta de nuevo.`);
        return;
      }
      sessions[from] = { step: 'WAIT_NAME', code };
      await sendText(from, `✅ Código válido. Ahora necesito tu *nombre completo* para registrar el canje.`);
    } catch (e) {
      console.error('Error validando código:', e.message);
      await sendText(from, 'Hubo un error validando tu código. Por favor intenta en unos minutos.');
    }
    return;
  }

  if (session.step === 'WAIT_NAME') {
    if (input.length < 3) { await sendText(from, 'Por favor ingresa tu nombre completo.'); return; }
    sessions[from] = { ...session, step: 'WAIT_CEDULA', name: input };
    await sendText(from, `Perfecto, *${input}*. Ahora envíame tu número de *cédula*.`);
    return;
  }

  if (session.step === 'WAIT_CEDULA') {
    if (!/^\d{6,12}$/.test(input)) { await sendText(from, 'Por favor ingresa un número de cédula válido (solo números).'); return; }
    try {
      const { data } = await axios.post(`${API_URL}/redemptions/redeem`, {
        phone: from, name: session.name, cedula: input, scratchCode: session.code,
      });
      sessions[from] = { step: 'IDLE' };
      await sendText(from,
        `🎁 ¡Felicitaciones, *${session.name}*!\n\nTu código DGo es:\n*${data.dgoCode}*\n\nIngrésalo en la app DGo para activar tu mes gratis. ¡Disfrútalo! 🎶`
      );
    } catch (e) {
      console.error('Error en canje:', e.message);
      await sendText(from, 'Hubo un error procesando tu canje. Por favor intenta en unos minutos.');
    }
  }
}

// ── Webhook ──────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);

  try {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message?.type === 'text') {
      await handleMessage({ from: message.from, text: message.text?.body });
    }
  } catch (e) {
    console.error('Error procesando webhook:', e.message);
  }
  res.sendStatus(200);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sporade-bot' }));

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || process.env.BOT_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Bot webhook corriendo en puerto ${PORT}`));
