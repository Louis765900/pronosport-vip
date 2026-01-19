import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Connexion automatique à Upstash via les variables d'environnement
const redis = Redis.fromEnv();

export async function GET(req: Request) {
  try {
    // 1. VÉRIFICATION DES CLÉS
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const groqKey = process.env.GROQ_API_KEY;
    const footballKey = process.env.API_FOOTBALL_KEY;
    const siteUrl = "https://pronosport-vip-kh2g.vercel.app"; 

    if (!telegramToken || !chatId || !groqKey || !footballKey) {
      return NextResponse.json({ error: "Clés manquantes" }, { status: 500 });
    }

    // 2. RÉCUPÉRATION DES MATCHS (Sur 48h pour avoir du choix)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = tomorrow.toISOString().split('T')[0];

    // LISTE ÉTENDUE DES LIGUES (Pour avoir des matchs même le lundi !)
    // Majors : 61(L1), 39(PL), 140(Liga), 135(SerieA), 78(Bundes), 2(LDC), 3(Europa)
    // Secondaires : 62(L2), 40(Championship), 94(Portugal), 88(Pays-Bas), 203(Turquie), 307(Arabie)
    const leaguesIds = "61-39-140-135-78-2-3-62-40-94-88-203-307"; 
    
    const footResponse = await fetch(`https://v3.football.api-sports.io/fixtures?from=${dateFrom}&to=${dateTo}&ids=${leaguesIds}&timezone=Europe/Paris`, {
      headers: { 'x-apisports-key': footballKey }
    });
    
    const footData = await footResponse.json();
    let matchesDataForAI = "";
    let topMatches: any[] = [];

    if (!footData.response || footData.response.length === 0) {
       return NextResponse.json({ message: "Aucun match trouvé (même en ligues secondaires)." });
    } else {
      // On prend les 3 premiers matchs fournis par l'API
      topMatches = footData.response.slice(0, 3);
      
      matchesDataForAI = topMatches.map((m: any, index: number) => {
        const matchDate = m.fixture.date.split('T')[0];
        const isToday = matchDate === dateFrom;
        const dayLabel = isToday ? "AUJOURD'HUI" : "DEMAIN";

        return `MATCH_${index + 1} (ID:${m.fixture.id}):
        - Affiche : ${m.teams.home.name} vs ${m.teams.away.name}
        - Ligue : ${m.league.name}
        - Timing : ${dayLabel} à ${m.fixture.date.split('T')[1].slice(0,5)}`;
      }).join('\n\n');
    }

    // 3. GÉNÉRATION DU PRONOSTIC (IA)
    const promptUser = `
      Tu es l'algorithme de prédiction "Pronosport VIP".
      
      Voici les matchs sélectionnés :
      ${matchesDataForAI}

      TÂCHE :
      Génère les pronostics techniques pour ces 3 matchs.
      
      RÈGLES STRICTES :
      1. Ne cite AUCUN nom de joueur (Pas de risque de transfert/blessure).
      2. Base-toi uniquement sur la logique domicile/extérieur et la ligue.
      3. Sois direct et pro.

      FORMAT DE SORTIE (Respecte-le à la lettre) :

      🔥 **LA SÉLECTION DU MOMENT** 🔥

      👇👇👇

      (Pour le Match 1)
      ⚽ **[Equipe A] vs [Equipe B]**
      📅 *[Date/Heure]* - 🏆 *[Ligue]*
      🟢 **SAFE :** [Prono fiable cote ~1.50]
      💣 **FUN :** [Prono audacieux cote ~2.40]

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      (Pour le Match 2...)

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      (Pour le Match 3...)

      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

      🤖 **Pronostics générés par l'IA du site.**
      📊 **Voir l'analyse complète :**
      👉 ${siteUrl}
    `;

    // Appel à Groq (Llama 3.3)
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Tu es un algorithme de paris sportifs froid et précis." },
          { role: "user", content: promptUser }
        ],
        temperature: 0.3, 
      }),
    });

    const aiJson = await aiResponse.json();
    
    if (aiJson.error) return NextResponse.json({ error: aiJson.error.message }, { status: 500 });

    let finalMessage = aiJson.choices?.[0]?.message?.content || "Erreur.";

    // Nettoyage du début de message
    if (finalMessage.includes("🔥")) {
      finalMessage = finalMessage.substring(finalMessage.indexOf("🔥"));
    }

    // 4. SAUVEGARDE DANS UPSTASH (Pour la validation automatique plus tard)
    for (const match of topMatches) {
        // On sauvegarde les infos avec une expiration de 48h
        await redis.set(`pending_match:${match.fixture.id}`, {
            home: match.teams.home.name,
            away: match.teams.away.name,
            date: match.fixture.date,
            ai_analysis: finalMessage // On garde le texte pour que le juge puisse vérifier le prono
        });
        await redis.expire(`pending_match:${match.fixture.id}`, 172800); // 2 jours
    }

    // 5. ENVOI TELEGRAM
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: chatId,
      text: finalMessage,
    });

    await fetch(`${telegramUrl}?${params}`);

    return NextResponse.json({ success: true, saved_matches: topMatches.length, message: "Envoyé et Sauvegardé !" });

  } catch (error: any) {
    console.error("Erreur Cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}