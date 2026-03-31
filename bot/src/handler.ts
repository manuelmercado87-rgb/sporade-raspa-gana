import { sendText } from './whatsapp';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

// Estado temporal en memoria (en prod usamos Redis o DB)
const sessions: Record<string, Session> = {};

type Step = 'IDLE' | 'WAIT_CODE' | 'WAIT_NAME' | 'WAIT_CEDULA';

interface Session {
  step: Step;
  code?: string;
  name?: string;
}

interface IncomingMessage {
  from: string;
  name?: string;
  messageId: string;
  type: string;
  text?: string;
  timestamp: string;
}

export async function handleMessage(msg: IncomingMessage): Promise<void> {
  const { from, text } = msg;
  const input = text?.trim() ?? '';
  const session = sessions[from] ?? { step: 'IDLE' };

  console.log(`[${from}] step=${session.step} input="${input}"`);

  switch (session.step) {
    case 'IDLE': {
      // Cualquier mensaje arranca el flujo
      sessions[from] = { step: 'WAIT_CODE' };
      await sendText(
        from,
        '¡Hola! Bienvenido a la campaña *Sporade x DGo Raspa y Gana* 🎉\n\nPor favor, envíame el *código* que aparece en tu tarjeta raspadito.'
      );
      break;
    }

    case 'WAIT_CODE': {
      const code = input.toUpperCase();

      // Validar código con la API
      try {
        const { data } = await axios.post(`${API_URL}/redemptions/validate-code`, { code });

        if (!data.valid) {
          await sendText(from, `❌ El código *${code}* no es válido o ya fue utilizado. Verifica e intenta de nuevo.`);
          return;
        }

        sessions[from] = { step: 'WAIT_NAME', code };
        await sendText(from, `✅ Código válido. Ahora necesito tu *nombre completo* para registrar el canje.`);
      } catch {
        await sendText(from, 'Hubo un error validando tu código. Por favor intenta en unos minutos.');
      }
      break;
    }

    case 'WAIT_NAME': {
      if (input.length < 3) {
        await sendText(from, 'Por favor ingresa tu nombre completo.');
        return;
      }

      sessions[from] = { ...session, step: 'WAIT_CEDULA', name: input };
      await sendText(from, `Perfecto, *${input}*. Ahora envíame tu número de *cédula*.`);
      break;
    }

    case 'WAIT_CEDULA': {
      if (!/^\d{6,12}$/.test(input)) {
        await sendText(from, 'Por favor ingresa un número de cédula válido (solo números).');
        return;
      }

      try {
        const { data } = await axios.post(`${API_URL}/redemptions/redeem`, {
          phone: from,
          name: session.name,
          cedula: input,
          scratchCode: session.code,
        });

        sessions[from] = { step: 'IDLE' };
        await sendText(
          from,
          `🎁 ¡Felicitaciones, *${session.name}*!\n\nTu código DGo es:\n*${data.dgoCode}*\n\nIngrésalo en la app DGo para activar tu mes gratis. ¡Disfrútalo! 🎶`
        );
      } catch {
        await sendText(from, 'Hubo un error procesando tu canje. Por favor intenta en unos minutos.');
      }
      break;
    }
  }
}
