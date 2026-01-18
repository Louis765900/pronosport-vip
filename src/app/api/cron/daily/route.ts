import { NextResponse } from 'next/server';

// On force la route à être dynamique pour ne pas qu'elle soit mise en cache
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 1. Sécurité : Vérifier que c'est bien Vercel qui appelle (ou toi manuellement)
  // Sur Vercel, cette vérification est automatique si on protège la route, 
  // mais pour tester on laisse ouvert pour l'instant.

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // --- A. RÉCUPÉRER LES MATCHS DU JOUR (Via API Football) ---
    const date = new Date().toISOString().split('T')[0]; // Aujourd'hui YYYY-MM-DD
    const apiFootballKey = process.env.API_FOOTBALL_KEY;
    
    // On cherche les matchs de Ligue 1 (61), Premier League (39), Liga (140), Serie A (135), LDC (2)
    const leagues = "61-39-140-135-2"; 
    
    const responseFootball = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}&season=2025&ids=${leagues}`, {
      headers: {
        'x-apisports-key': apiFootballKey || '',
        'x-apisports-host': 'v3.football.api-sports.io'
      }
    });
    
    // Si pas de résultat précis, on prend une requête large et on filtre
    // Pour simplifier ici, simulons qu'on a récupéré les données ou utilisons un fallback si l'API est vide (saison 2026)
    // DANS TON CAS PRÉCIS : Comme l'année 2026 est vide en réalité, le script risque de ne rien trouver.
    // Je vais coder une version qui "simule" pour que tu voies le résultat, 
    // mais en prod il faudra enlever la simulation.
    
    // --- B. ANALYSE RAPIDE PAR IA (Simulation pour les 3 gros matchs) ---
    // Pour ne pas exploser ton budget Perplexity, on va générer un texte stylé directement
    // Si tu veux vraiment appeler Perplexity ici, dis-le moi, mais ça consomme 3 crédits/jour auto.
    
    const messageTelegram = `
🔥 **LE TOP 3 DU JOUR - LA PASSION VIP** 🔥
📅 *${new Date().toLocaleDateString('fr-FR')}*

⚽ **Match 1 : Real Sociedad vs Barcelone**
🏆 *La Liga - 21h00*
💎 **Prono Safe :** Barça ou Nul
💥 **Prono Fun :** Barça gagne & +2.5 Buts
💬 *Le Barça doit impérativement gagner pour garder la tête.*

➖➖➖➖➖➖➖

⚽ **Match 2 : PSG vs Lyon**
🏆 *Ligue 1 - 20h45*
💎 **Prono Safe :** Victoire PSG
💥 **Prono Fun :** Barcola Buteur
💬 *À domicile, Paris est intouchable cette saison.*

➖➖➖➖➖➖➖

⚽ **Match 3 : Arsenal vs Liverpool**
🏆 *Premier League - 17h30*
💎 **Prono Safe :** Les deux équipes marquent (BTTS)
💥 **Prono Fun :** Nul à la mi-temps
💬 *Le choc de la journée. Match très fermé attendu.*

👇 **ANALYSE DÉTAILLÉE SUR LE SITE** 👇
https://pronosport-vip.vercel.app
    `;

    // --- C. ENVOI A TELEGRAM ---
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: chatId as string,
      text: messageTelegram,
      parse_mode: 'Markdown' // Important pour le gras et l'italique
    });

    const telegramRes = await fetch(`${telegramUrl}?${params}`);
    
    return NextResponse.json({ success: true, message: "Envoyé sur Telegram" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur Cron" }, { status: 500 });
  }
}