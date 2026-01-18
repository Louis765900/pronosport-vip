import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    // 1. CONFIGURATION
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const groqKey = process.env.GROQ_API_KEY;
    const footballKey = process.env.API_FOOTBALL_KEY;
    const footballHost = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
    
    // 👇 METS TON VRAI SITE ICI (celui de Vercel ou ton domaine perso)
    const siteUrl = "https://pronosport-vip-kh2g.vercel.app"; 

    if (!telegramToken || !chatId || !groqKey || !footballKey) {
      return NextResponse.json({ error: "Clés manquantes sur Vercel" }, { status: 500 });
    }

    // 2. RECUPERATION MATCHS
    const today = new Date().toISOString().split('T')[0];
    const leaguesIds = "2-39-61-135-140-78";
    
    const footResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&ids=${leaguesIds}`, {
      headers: { 'x-apisports-key': footballKey, 'x-apisports-host': footballHost }
    });
    
    const footData = await footResponse.json();
    let matchesList = "Pas de gros matchs aujourd'hui. Fais une analyse globale.";

    if (footData.response && footData.response.length > 0) {
      matchesList = footData.response.slice(0, 15).map((m: any) => 
        `- ${m.league.name}: ${m.teams.home.name} vs ${m.teams.away.name} (${m.fixture.date.split('T')[1].slice(0,5)})`
      ).join('\n');
    }

    // 3. GENERATION PROMPT (DESIGN AMÉLIORÉ)
    const promptUser = `
      Tu es l'expert "La Passion VIP". Ton style est percutant, pro et très aéré.
      Voici les matchs : ${matchesList}

      TÂCHE : Sélectionne les 3 meilleures affiches et formate le message EXACTEMENT comme ci-dessous.

      RÈGLES DE DESIGN :
      - Utilise des sauts de ligne doubles pour aérer.
      - Ne mets JAMAIS de phrases d'intro.
      - Utilise les emojis indiqués.

      MODÈLE OBLIGATOIRE :

      🔥 **LA SÉLECTION VIP DU JOUR** 🔥
      📅 *${today}*

      👇👇👇

      ⚽ **MATCH 1 : [Equipe A] vs [Equipe B]**
      🏆 *[Nom de la Ligue]*
      🟢 **SAFE :** [Prono fiable et court]
      💣 **FUN :** [Prono risqué ou Buteur]

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      ⚽ **MATCH 2 : [Equipe A] vs [Equipe B]**
      🏆 *[Nom de la Ligue]*
      🟢 **SAFE :** [Prono fiable et court]
      💣 **FUN :** [Prono risqué ou Buteur]

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      ⚽ **MATCH 3 : [Equipe A] vs [Equipe B]**
      🏆 *[Nom de la Ligue]*
      🟢 **SAFE :** [Prono fiable et court]
      💣 **FUN :** [Prono risqué ou Buteur]

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      📊 **Analyse détaillée & Bankroll :**
      👉 ${siteUrl}
    `;

    // Appel Groq (Llama 3.3)
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Tu es un bot de notification Telegram strict." },
          { role: "user", content: promptUser }
        ],
        temperature: 0.7,
      }),
    });

    const aiJson = await aiResponse.json();
    
    if (aiJson.error) {
        return NextResponse.json({ error: aiJson.error.message }, { status: 500 });
    }

    let finalMessage = aiJson.choices?.[0]?.message?.content || "Erreur analyse.";

    // Nettoyage anti-bavardage
    if (finalMessage.includes("🔥")) {
      finalMessage = finalMessage.substring(finalMessage.indexOf("🔥"));
    }

    // 4. ENVOI TELEGRAM
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    
    // On n'utilise pas Markdown ici pour garantir que le lien fonctionne bien sans casser le format
    // L'IA génère déjà les étoiles et emojis qui rendent bien en texte brut sur Telegram
    const params = new URLSearchParams({
      chat_id: chatId,
      text: finalMessage,
    });

    await fetch(`${telegramUrl}?${params}`);

    return NextResponse.json({ success: true, message: "Envoyé avec le nouveau design !" });

  } catch (error: any) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}