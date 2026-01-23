// src/app/api/stats/bankroll/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
        if (!redisUrl || !redisToken) throw new Error("Redis environment variables are not set.");

        const redis = new Redis({ url: redisUrl, token: redisToken });

        // Fetch the last 100 entries from the bankroll history
        const history: string[] = await redis.lrange('bankroll:history', 0, 99);
        
        if (!history || history.length === 0) {
            // Return a default starting point if no history exists
            return NextResponse.json([{ date: new Date().toISOString().split('T')[0], bankroll: 100 }]);
        }

        // The data is stored as a stringified JSON, so we need to parse it.
        // It's stored with LPUSH, so it's in reverse chronological order. We reverse it back.
        const formattedHistory = history.map(item => JSON.parse(item)).reverse();

        return NextResponse.json(formattedHistory);

    } catch (error: any) {
        console.error("Error fetching bankroll history:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
