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
const SUPPORT_LINK = 'https://link-de-soporte';

// ── FAQ detector ─────────────────────────────────────────────────
const FAQS = [
  {
    triggers: ['hola', 'buenas', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches', 'hi', 'hey', 'buen día', 'buen dia'],
    response: '¡Hola! 👋 Bienvenido al bot oficial de la campaña *Sporade x DGo Raspa y Gana*.\n\nEnvíame tu código raspadito cuando lo tengas listo, o escribe *ayuda* si tienes alguna pregunta.',
  },
  {
    triggers: ['cómo funciona', 'como funciona', 'cómo participo', 'como participo', 'cómo canjeo', 'como canjeo', 'instrucciones', 'pasos', 'mecánica', 'mecanica', 'qué debo hacer', 'que debo hacer', 'cómo es', 'como es'],
    response: '¡Es muy fácil! 🎯\n\n1️⃣ Compra *12 botellas* de Sporade\n2️⃣ Lleva las 12 etiquetas a una tienda participante\n3️⃣ Recibe tu *tarjeta raspadito*\n4️⃣ Envíame el código aquí\n5️⃣ ¡Listo! Te entrego tu código DGo al instante 🏆',
  },
  {
    triggers: ['qué gano', 'que gano', 'cuál es el premio', 'cual es el premio', 'qué es dgo', 'que es dgo', 'para qué sirve', 'para que sirve', 'qué incluye', 'que incluye', 'premio', 'regalo'],
    response: '🏆 Ganas *1 mes gratis de DGo* para ver el Mundial sin pagar nada.\n\nDGo es la plataforma de streaming deportivo con todos los partidos del Mundial en vivo. Con tu código lo activas directo en la app o web de DGo.',
  },
  {
    triggers: ['hasta cuándo', 'hasta cuando', 'fecha', 'vigencia', 'cuándo vence', 'cuando vence', 'plazo', 'cuándo termina', 'cuando termina', 'cuándo empieza', 'cuando empieza', 'fechas'],
    response: '📅 La campaña es válida del *1 de junio al 1 de agosto de 2025*.\n\nAsegúrate de canjear tu código antes de que termine.',
  },
  {
    triggers: ['dónde', 'donde', 'tiendas', 'ciudades', 'dónde consigo', 'donde consigo', 'dónde entrego', 'donde entrego', 'puntos de venta', 'en qué ciudad', 'en que ciudad'],
    response: '📍 La campaña aplica en *todo Colombia*. Puedes comprar las Sporade en tiendas, supermercados y distribuidores habituales, y entregar tus etiquetas en cualquier punto de venta participante.',
  },
  {
    triggers: ['cuántas botellas', 'cuantas botellas', 'cuántas etiquetas', 'cuantas etiquetas', 'cuánto necesito', 'cuanto necesito', 'cuántos productos', 'cuantos productos', 'cuántas necesito', 'cuantas necesito'],
    response: 'Necesitas *12 botellas de Sporade* para obtener una tarjeta raspadito. Guarda las 12 etiquetas y preséntelas en una tienda participante.',
  },
  {
    triggers: ['código no funciona', 'codigo no funciona', 'código inválido', 'codigo invalido', 'no reconoce', 'código malo', 'codigo malo', 'no sirve el código', 'no sirve el codigo', 'no acepta'],
    response: '😕 Si tu código no está funcionando puede ser porque:\n\n• Ya fue canjeado anteriormente\n• Hay un error al escribirlo (verifica mayúsculas y guiones)\n\nSi el problema persiste, contáctanos aquí 👉 ' + SUPPORT_LINK,
  },
  {
    triggers: ['gracias', 'thank you', 'thanks', 'mil gracias', 'muchas gracias', 'perfecto', 'listo', 'excelente', 'genial', 'qué bueno', 'que bueno', 'chévere', 'chevere', 'bacano', 'ya lo usé', 'ya lo use', 'ya lo activé', 'ya lo active'],
    response: '¡Con mucho gusto! 🙌 Disfruta el Mundial con DGo. ¡Vamos Colombia! 🇨🇴⚽',
  },
  {
    triggers: ['ayuda', 'soporte', 'problema', 'no me llegó', 'no me llego', 'error', 'falla', 'comuníqueme', 'comuniqueme', 'hablar con alguien', 'contacto', 'quiero hablar', 'no funciona'],
    response: 'Lamentamos el inconveniente 😔 Nuestro equipo de soporte puede ayudarte directamente aquí 👉 ' + SUPPORT_LINK,
  },
];

function detectFAQ(input) {
  const normalized = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const faq of FAQS) {
    for (const trigger of faq.triggers) {
      const normalizedTrigger = trigger.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedTrigger)) return faq.response;
    }
  }
  return null;
}

async function handleMessage({ from, text }) {
  const input = (text || '').trim();
  const session = sessions[from] || { step: 'IDLE' };

  console.log(`[${from}] step=${session.step} input="${input}"`);

  // FAQ — responde en cualquier paso si no está en medio de un canje
  if (session.step === 'IDLE') {
    const faqResponse = detectFAQ(input);
    if (faqResponse) {
      await sendText(from, faqResponse);
      return;
    }

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
      // Si ya conocemos nombre y cédula del usuario, saltamos esos pasos
      if (session.name && session.cedula) {
        try {
          const { data: redeemData } = await axios.post(`${API_URL}/redemptions/redeem`, {
            phone: from, name: session.name, cedula: session.cedula, scratchCode: code,
          });
          sessions[from] = { step: 'IDLE', name: session.name, cedula: session.cedula };
          await sendText(from,
            `🎁 ¡Felicitaciones, *${session.name}*!\n\nTu código DGo es:\n*${redeemData.dgoCode}*\n\nIngrésalo en la app DGo para activar tu mes gratis. ¡Disfrútalo! 🎶`
          );
        } catch (e) {
          console.error('Error en canje:', e.response?.data || e.message);
          await sendText(from, 'Hubo un error procesando tu canje. Por favor intenta en unos minutos.');
        }
        return;
      }

      sessions[from] = { step: 'WAIT_NAME', code };
      await sendText(from, `✅ Código válido. Ahora necesito tu *nombre completo* para registrar el canje.`);
    } catch (e) {
      console.error('Error validando código:', e.response?.data || e.message);
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
      // Conservamos nombre y cédula para futuros canjes
      sessions[from] = { step: 'IDLE', name: session.name, cedula: input };
      await sendText(from,
        `🎁 ¡Felicitaciones, *${session.name}*!\n\nTu código DGo es:\n*${data.dgoCode}*\n\nIngrésalo en la app DGo para activar tu mes gratis. ¡Disfrútalo! 🎶`
      );
    } catch (e) {
      console.error('Error en canje:', e.response?.data || e.message);
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
    console.error('Error procesando webhook:', e.response?.data || e.message);
  }
  res.sendStatus(200);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sporade-bot' }));

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || process.env.BOT_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Bot webhook corriendo en puerto ${PORT}`));
