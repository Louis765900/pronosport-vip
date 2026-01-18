import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. On récupère l'image envoyée par ton site
    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: "Pas d'image reçue" }, { status: 400 });
    }

    // 2. On récupère tes clés secrètes
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // 3. On prépare le colis pour Telegram
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', chatId as string);
    telegramFormData.append('photo', imageFile);
    // Tu peux modifier le texte ci-dessous si tu veux !
    telegramFormData.append('caption', '🚀 *Nouveau Pronostic La Passion VIP !* \n\n⚡ Analyse générée par IA.\n👉 Rejoignez le VIP pour plus de détails.\n\n#ParisSportifs #LaPassionVIP');
    telegramFormData.append('parse_mode', 'Markdown');

    // 4. On envoie officiellement à Telegram
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: telegramFormData,
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Erreur Telegram:", result);
      return NextResponse.json({ error: result.description }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur Serveur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}