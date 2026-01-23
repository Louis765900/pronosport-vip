import { Redis } from '@upstash/redis';
import { ShieldCheck, Star, TrendingUp } from 'lucide-react';

async function getVipData() {
    try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

        if (!redisUrl || !redisToken) {
            throw new Error("Redis configuration is missing.");
        }

        const redis = new Redis({ url: redisUrl, token: redisToken });
        
        // Utiliser une pipeline pour l'efficacité
        const pipeline = redis.pipeline();
        pipeline.get('stats:vip:wins');
        pipeline.get('stats:vip:total');
        pipeline.get('vip:daily:match');

        const [wins, total, dailyMatch] = await pipeline.exec<[number | null, number | null, any | null]>();

        // Initialiser les compteurs si ils n'existent pas
        const winsCount = wins ?? 0;
        const totalCount = total ?? 0;

        const successRate = totalCount > 0 ? ((winsCount / totalCount) * 100).toFixed(1) : "N/A";

        return {
            wins: winsCount,
            total: totalCount,
            successRate,
            dailyMatch,
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des données VIP:", error);
        // Retourner un état par défaut en cas d'erreur
        return {
            wins: 0,
            total: 0,
            successRate: "Erreur",
            dailyMatch: null
        };
    }
}


export default async function VipConfidenceCard() {
    const { successRate, dailyMatch } = await getVipData();

    return (
        <div className="relative rounded-xl border-4 border-yellow-400 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl shadow-yellow-500/20 overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-2 text-yellow-300 bg-gray-900/50 px-3 py-1 rounded-full text-xs font-bold">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>ZONE CONFIANCE VIP</span>
            </div>
            
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-200">Taux de Réussite Historique</h3>
                <div className="flex items-center justify-center gap-3 mt-2">
                    <TrendingUp className="h-8 w-8 text-green-400" />
                    <p className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                        {successRate}%
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Basé sur les pronostics VIP passés</p>
            </div>

            <div className="h-px bg-yellow-400/30 w-full mb-6"></div>

            <div>
                <h4 className="flex items-center justify-center text-md font-semibold text-gray-200 mb-3">
                    <ShieldCheck className="h-5 w-5 mr-2 text-yellow-400" />
                    Le Match VIP du Jour
                </h4>
                {dailyMatch && dailyMatch.fixture_id ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="font-semibold text-yellow-400 text-sm">{dailyMatch.league}</p>
                        <p className="text-xl font-bold text-white my-1">
                            {dailyMatch.home_team} <span className="text-gray-500">vs</span> {dailyMatch.away_team}
                        </p>
                        <p className="text-md font-medium text-green-400 bg-green-900/30 rounded-md px-4 py-1 inline-block">
                           {dailyMatch.pronostic}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Confiance estimée : {dailyMatch.confidence}%</p>
                    </div>
                ) : (
                    <div className="text-center bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-400">Aucun match ne remplit les critères de confiance VIP aujourd'hui.</p>
                        <p className="text-xs text-gray-500 mt-1">Revenez demain pour une nouvelle analyse.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
