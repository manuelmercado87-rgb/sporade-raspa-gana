import { Router, Request, Response } from 'express';
import { handleMessage } from './handler';

export const webhookRouter = Router();

// Verificación del webhook (Meta requiere esto al configurarlo)
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recepción de mensajes
webhookRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message && contact) {
      await handleMessage({
        from: message.from,           // número de teléfono
        name: contact.profile?.name,  // nombre del contacto
        messageId: message.id,
        type: message.type,
        text: message.text?.body,
        timestamp: message.timestamp,
      });
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }

  // Meta requiere respuesta 200 inmediata
  res.sendStatus(200);
});
