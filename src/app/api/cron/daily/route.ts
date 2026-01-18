import { NextResponse } from 'next/server';

// On force le mode dynamique pour que le script s'exécute vraiment chaque jour
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // On laisse 60 secondes au script pour l'analyse IA

export async function GET(req: Request) {
  try {
    // 1. VÉRIFICATION DES CLÉS DE SÉCURITÉ
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const pplxKey = process.env.PERPLEXITY_API_KEY;
    const footballKey = process.env.API_FOOTBALL_KEY;
    const footballHost = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';

    if (!telegramToken || !chatId || !pplxKey || !footballKey) {
      return NextResponse.json({ error: "Clés API manquantes dans Vercel" }, { status: 500 });
    }

    // 2. RÉCUPÉRATION DES MATCHS DU JOUR (VRAIE DATA)
    // On prend la date d'aujourd'hui format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // IDs des ligues majeures : LDC(2), PL(39), L1(61), Serie A(135), Liga(140), Bundesliga(78)
    const leaguesIds = "2-39-61-135-140-78";
    
    const footResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&ids=${leaguesIds}`, {
      headers: {
        'x-apisports-key': footballKey,
        'x-apisports-host': footballHost
      }
    });
    
    const footData = await footResponse.json();
    let matchesList = "Aucun match majeur aujourd'hui.";

    // On prépare une liste propre pour l'IA
    if (footData.response && footData.response.length > 0) {
      matchesList = footData.response.map((m: any) => 
        `- ${m.league.name}: ${m.teams.home.name} vs ${m.teams.away.name} (Heure: ${m.fixture.date.split('T')[1].slice(0,5)})`
      ).join('\n');
    }

    // 3. ANALYSE ET RÉDACTION PAR PERPLEXITY (LE CERVEAU)
    const promptIA = `
      Tu es l'Expert Principal de "La Passion VIP".
      Voici les matchs disponibles aujourd'hui (${today}) :
      ${matchesList}

      TÂCHE :
      1. Sélectionne les 3 meilleures opportunités (si peu de matchs, analyses-en 1 ou 2).
      2. Rédige DIRECTEMENT un message Telegram prêt à être envoyé.
      
      STYLE REQUIS :
      - Utilise des émojis : 🔥, ⚽, 💎, 💰, 🚀
      - Structure :
        👋 *Bonjour la Team VIP !*
        
        ⚽ **MATCH 1 : [Equipes]**
        🏆 *[Ligue]*
        💎 Safe : [Prono]
        💥 Fun : [Prono Coté]
        📝 [Phrase d'analyse courte]
        
        (Répète pour les autres matchs...)
        
        👉 *Retrouvez l'analyse complète sur le site !*
      
      IMPORTANT : Ne mets aucun texte d'introduction ("Voici le message..."), donne juste le contenu du message.
    `;

    const aiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pplxKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: promptIA }]
      }),
    });

    const aiJson = await aiResponse.json();
    const finalMessage = aiJson.choices?.[0]?.message?.content || "Erreur de génération IA";

    // 4. ENVOI SUR TELEGRAM
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: chatId,
      text: finalMessage,
      // On retire le parse_mode Markdown pour éviter les crashs si l'IA met des caractères spéciaux bizarres
    });

    await fetch(`${telegramUrl}?${params}`);

    return NextResponse.json({ success: true, message: "Envoyé sur Telegram avec succès !" });

  } catch (error) {
    console.error("Erreur Cron:", error);
    return NextResponse.json({ error: "Erreur interne du Robot" }, { status: 500 });
  }
}