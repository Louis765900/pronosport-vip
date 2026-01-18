import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    // 1. VERIFICATION DES CLES
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const groqKey = process.env.GROQ_API_KEY; // Clé Groq
    const footballKey = process.env.API_FOOTBALL_KEY;
    const footballHost = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';

    if (!telegramToken || !chatId || !groqKey || !footballKey) {
      return NextResponse.json({ error: "Clés manquantes (Vérifie GROQ_API_KEY sur Vercel)" }, { status: 500 });
    }

    // 2. RECUPERATION DES MATCHS
    const today = new Date().toISOString().split('T')[0];
    const leaguesIds = "2-39-61-135-140-78"; // LDC, PL, L1, Serie A, Liga, Bundesliga
    
    const footResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&ids=${leaguesIds}`, {
      headers: {
        'x-apisports-key': footballKey,
        'x-apisports-host': footballHost
      }
    });
    
    const footData = await footResponse.json();
    let matchesList = "Pas de matchs majeurs aujourd'hui. Invente une analyse sur l'actu foot.";

    if (footData.response && footData.response.length > 0) {
      // On prend les 15 premiers matchs pour l'IA
      matchesList = footData.response.slice(0, 15).map((m: any) => 
        `- ${m.league.name}: ${m.teams.home.name} vs ${m.teams.away.name} (${m.fixture.date.split('T')[1].slice(0,5)})`
      ).join('\n');
    }

    // 3. GENERATION DU TEXTE VIA GROQ (Llama 3)
    const promptUser = `
      Tu es un expert en paris sportifs professionnel.
      Voici les matchs du jour :
      ${matchesList}

      TÂCHE :
      Sélectionne les 3 meilleures affiches et rédige le post Telegram.

      FORMAT STRICT (Respecte les émojis et sauts de ligne) :
      
      👋 *La Sélection VIP du ${today}*

      ➖➖➖➖➖➖➖

      ⚽ **[Equipe A] vs [Equipe B]**
      🏆 *[Ligue]*
      💎 Safe : [Prono fiable]
      💥 Fun : [Prono risqué]
      
      (Répète pour les 2 autres matchs)

      ➖➖➖➖➖➖➖
      
      👉 *Analyse détaillée sur le site !*

      IMPORTANT : Ne mets AUCUNE introduction. Commence direct par 👋.
    `;

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Modèle Gratuit & Puissant
        messages: [
          { role: "system", content: "Tu es un bot Telegram strict." },
          { role: "user", content: promptUser }
        ],
        temperature: 0.6,
      }),
    });

    const aiJson = await aiResponse.json();
    
    if (aiJson.error) {
        console.error("Erreur Groq:", aiJson.error);
        return NextResponse.json({ error: "Erreur IA Groq" }, { status: 500 });
    }

    let finalMessage = aiJson.choices?.[0]?.message?.content || "Erreur analyse.";

    // Nettoyage de sécurité
    if (finalMessage.includes("👋")) {
      finalMessage = finalMessage.substring(finalMessage.indexOf("👋"));
    }

    // 4. ENVOI TELEGRAM
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: chatId,
      text: finalMessage,
    });

    await fetch(`${telegramUrl}?${params}`);

    return NextResponse.json({ success: true, message: "Envoyé avec Groq !" });

  } catch (error) {
    console.error("Erreur Cron:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}