import { NextResponse, NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Pronostic, ServerBet } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type BetResult = 'WON' | 'LOST' | 'PENDING';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

// Helper function to determine the result of a bet
function checkBetResult(pronostic: Pronostic, match: any): BetResult {
    const { market, prediction } = pronostic;
    const { home, away } = match.goals;

    // If match is not finished, return PENDING
    if (!['FT', 'AET', 'PEN'].includes(match.fixture.status.short)) {
        return 'PENDING';
    }

    switch (market.toLowerCase()) {
        case 'btts oui':
        case 'les deux équipes marquent':
            return (home > 0 && away > 0) ? 'WON' : 'LOST';

        case 'btts non':
            return (home === 0 || away === 0) ? 'WON' : 'LOST';

        case 'over 2.5 buts':
        case 'plus de 2.5 buts':
            return (home + away > 2.5) ? 'WON' : 'LOST';

        case 'under 2.5 buts':
        case 'moins de 2.5 buts':
            return (home + away < 2.5) ? 'WON' : 'LOST';

        case 'double chance':
            const winner = match.teams.home.winner ? 'home' : (match.teams.away.winner ? 'away' : 'draw');
            if (prediction.toLowerCase().includes('1x') || prediction.toLowerCase().includes(match.teams.home.name)) {
                return (winner === 'home' || winner === 'draw') ? 'WON' : 'LOST';
            }
            if (prediction.toLowerCase().includes('x2') || prediction.toLowerCase().includes(match.teams.away.name)) {
                 return (winner === 'away' || winner === 'draw') ? 'WON' : 'LOST';
            }
            // If prediction is not clear for double chance, it's a loss.
            return 'LOST';

        default: // Assuming winner market (1N2)
            const homeWon = match.teams.home.winner;
            const awayWon = match.teams.away.winner;
            if (prediction.includes(match.teams.home.name) && homeWon) return 'WON';
            if (prediction.includes(match.teams.away.name) && awayWon) return 'WON';
            if ((prediction.toLowerCase().includes('nul') || prediction.toLowerCase().includes('draw')) && !homeWon && !awayWon) return 'WON';
            return 'LOST';
    }
}

/**
 * Verification avec Perplexity AI pour les marches complexes
 */
async function verifyBetWithPerplexity(bet: ServerBet): Promise<BetResult> {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    if (!perplexityKey) {
        console.log('[CHECK-RESULTS] Perplexity API key not configured, skipping AI verification');
        return 'PENDING';
    }

    try {
        const prompt = `Tu es un expert en paris sportifs. Verifie si ce pari est gagne ou perdu.

Match: ${bet.homeTeam} vs ${bet.awayTeam}
Date du match: ${bet.date}
Type de pari: ${bet.market}
Selection: ${bet.selection}

Recherche le resultat reel du match et determine si le pari est gagne ou perdu.
IMPORTANT: Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres:
{"result": "WON"} si le pari est gagne
{"result": "LOST"} si le pari est perdu
{"result": "PENDING"} si le match n'est pas encore termine ou si tu ne trouves pas l'information`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            console.error('[CHECK-RESULTS] Perplexity API error:', response.status);
            return 'PENDING';
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        console.log(`[CHECK-RESULTS] Perplexity response for ${bet.homeTeam} vs ${bet.awayTeam}:`, content);

        // Extraire le JSON de la reponse
        const jsonMatch = content.match(/\{[^}]+\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (['WON', 'LOST', 'PENDING'].includes(parsed.result)) {
                return parsed.result as BetResult;
            }
        }

        return 'PENDING';
    } catch (error) {
        console.error('[CHECK-RESULTS] Perplexity verification error:', error);
        return 'PENDING';
    }
}

/**
 * Envoyer une notification push a l'utilisateur
 */
async function sendPushNotification(
    email: string,
    betResult: BetResult,
    bet: ServerBet,
    profit: number
): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) return;

    try {
        const title = betResult === 'WON' ? 'Pari Gagne !' : 'Pari Perdu';
        const body = betResult === 'WON'
            ? `${bet.homeTeam} vs ${bet.awayTeam} - ${bet.selection} (+${profit.toFixed(2)})`
            : `${bet.homeTeam} vs ${bet.awayTeam} - ${bet.selection}`;

        await fetch(`${baseUrl}/api/push/notify?key=${adminSecret}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                title,
                body,
                url: '/mes-paris',
                betId: bet.id
            })
        });

        console.log(`[CHECK-RESULTS] Push notification sent to ${email}`);
    } catch (error) {
        console.error(`[CHECK-RESULTS] Failed to send push notification to ${email}:`, error);
    }
}


export async function GET(req: NextRequest) {
    // 1. SECURISATION
    const apiKey = req.nextUrl.searchParams.get('key');
    if (apiKey !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Acces non autorise.' }, { status: 401 });
    }

    try {
        // 2. CONNEXIONS
        const footballKey = process.env.API_FOOTBALL_KEY;
        if (!redisUrl || !redisToken || !footballKey) {
            throw new Error("Variables d'environnement manquantes pour Redis ou Football API.");
        }

        const redis = new Redis({ url: redisUrl, token: redisToken });

        let updates: string[] = [];
        let totalProfit = 0;
        const initialBankroll: number = 100;

        const currentBankrollStr: string | null = await redis.get('bankroll:current');
        let currentBankroll = currentBankrollStr ? parseFloat(currentBankrollStr) : initialBankroll;

        if (currentBankroll < 0) currentBankroll = initialBankroll;

        const pipeline = redis.pipeline();

        // ═══════════════════════════════════════════
        // PARTIE 1: VERIFICATION DES PARIS SYSTEME (pending_match:*)
        // ═══════════════════════════════════════════
        const systemKeys = await redis.keys('pending_match:*');

        if (systemKeys.length > 0) {
            updates.push(`--- Paris systeme (${systemKeys.length}) ---`);

            for (const key of systemKeys) {
                const pronosticData: string | null = await redis.get(key);
                if (!pronosticData) continue;

                const pronostic: Pronostic = JSON.parse(pronosticData);

                const fixtureResponse = await fetch(`https://v3.football.api-sports.io/fixtures?id=${pronostic.fixture_id}`, {
                    headers: { 'x-apisports-key': footballKey }
                });
                const fixtureData = await fixtureResponse.json();
                const match = fixtureData.response?.[0];

                if (!match) {
                    updates.push(`Match non trouve pour ${pronostic.teams} (ID: ${pronostic.fixture_id}). Suppression.`);
                    pipeline.del(key);
                    continue;
                }

                const betResult = checkBetResult(pronostic, match);

                if (betResult !== 'PENDING') {
                    const stakeAmount = (pronostic.staking.percentage / 100) * currentBankroll;
                    let profit = 0;

                    if (pronostic.is_vip) {
                        pipeline.incr('stats:vip:total');
                    }

                    if (betResult === 'WON') {
                        profit = stakeAmount * (pronostic.odds - 1);
                        if (pronostic.is_vip) {
                            pipeline.incr('stats:vip:wins');
                        }
                        updates.push(`GAGNE: ${pronostic.teams} | ${pronostic.market} (+${profit.toFixed(2)})`);
                    } else {
                        profit = -stakeAmount;
                        updates.push(`PERDU: ${pronostic.teams} | ${pronostic.market} (${profit.toFixed(2)})`);
                    }

                    totalProfit += profit;
                    pipeline.del(key);
                }
            }
        }

        // ═══════════════════════════════════════════
        // PARTIE 2: VERIFICATION DES PARIS UTILISATEURS (pending_user_bet:*)
        // Utilise Perplexity AI pour la verification
        // ═══════════════════════════════════════════
        const userBetKeys = await redis.keys('pending_user_bet:*');

        if (userBetKeys.length > 0) {
            updates.push(`--- Paris utilisateurs (${userBetKeys.length}) ---`);

            for (const key of userBetKeys) {
                const betData: string | null = await redis.get(key);
                if (!betData) continue;

                const bet: ServerBet = typeof betData === 'string' ? JSON.parse(betData) : betData;

                // Verifier avec Perplexity AI
                const betResult = await verifyBetWithPerplexity(bet);

                if (betResult !== 'PENDING') {
                    // Mettre a jour la liste des paris de l'utilisateur
                    const userBetsRaw = await redis.get(`user:${bet.userEmail}:bets`);
                    const userBets: ServerBet[] = userBetsRaw
                        ? (typeof userBetsRaw === 'string' ? JSON.parse(userBetsRaw) : userBetsRaw as ServerBet[])
                        : [];

                    const updatedBets = userBets.map(b =>
                        b.id === bet.id
                            ? {
                                ...b,
                                status: betResult.toLowerCase() as 'won' | 'lost',
                                settledAt: new Date().toISOString(),
                                perplexityVerified: true
                            }
                            : b
                    );

                    await redis.set(`user:${bet.userEmail}:bets`, JSON.stringify(updatedBets));

                    // Mettre a jour la bankroll de l'utilisateur
                    const userBankrollRaw = await redis.get(`user:${bet.userEmail}:bankroll`);
                    let userBankroll = userBankrollRaw ? parseFloat(String(userBankrollRaw)) : 100;

                    let profit = 0;
                    if (betResult === 'WON') {
                        profit = bet.potentialWin - bet.stake;
                        userBankroll += bet.potentialWin;
                        updates.push(`GAGNE: ${bet.userEmail} - ${bet.homeTeam} vs ${bet.awayTeam} (+${profit.toFixed(2)})`);
                    } else {
                        profit = -bet.stake;
                        updates.push(`PERDU: ${bet.userEmail} - ${bet.homeTeam} vs ${bet.awayTeam} (${profit.toFixed(2)})`);
                    }

                    await redis.set(`user:${bet.userEmail}:bankroll`, userBankroll);

                    // Envoyer notification push
                    await sendPushNotification(bet.userEmail, betResult, bet, profit);

                    // Supprimer du tracking
                    pipeline.del(key);
                }
            }
        }

        // ═══════════════════════════════════════════
        // PARTIE 3: MISE A JOUR DE LA BANKROLL GLOBALE
        // ═══════════════════════════════════════════
        if (totalProfit !== 0) {
            const newBankroll = currentBankroll + totalProfit;
            const bankrollHistoryEntry = {
                date: new Date().toISOString().split('T')[0],
                bankroll: parseFloat(newBankroll.toFixed(2)),
            };

            pipeline.set('bankroll:current', newBankroll);
            pipeline.lpush('bankroll:history', JSON.stringify(bankrollHistoryEntry));
            pipeline.ltrim('bankroll:history', 0, 99);

            updates.push(`Bankroll globale mise a jour: ${newBankroll.toFixed(2)}`);
        }

        await pipeline.exec();

        // Log
        if (updates.length === 0) {
            updates.push('Aucun paris a verifier.');
        }

        console.log("[CHECK-RESULTS] Summary:", updates.join("\n"));

        return NextResponse.json({ success: true, log: updates });

    } catch (error: any) {
        console.error("Erreur dans le cron 'check-results':", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
