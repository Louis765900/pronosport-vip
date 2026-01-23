// src/app/api/admin/publish/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

// Helper pour créer la connexion Redis
function getRedis() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

    if (!redisUrl || !redisToken) {
        throw new Error("Variables d'environnement Redis manquantes.");
    }

    return new Redis({ url: redisUrl, token: redisToken });
}

/**
 * Nettoie le texte pour le rendre compatible Telegram Markdown
 * - Échappe les caractères spéciaux qui cassent le parsing
 * - Préserve les * pour le gras
 */
function sanitizeForTelegramMarkdown(text: string): string {
    // Caractères à échapper dans Telegram Markdown V1 : _ ` [ ]
    // On NE touche PAS aux * car ils sont utilisés pour le gras
    return text
        .replace(/([_`\[\]])/g, '\\$1')
        // Supprimer les doubles backslash qui peuvent apparaître
        .replace(/\\\\/g, '\\');
}

/**
 * Convertit le Markdown vers texte brut (supprime le formatage)
 */
function stripMarkdown(text: string): string {
    return text
        // Supprimer les * (gras)
        .replace(/\*([^*]+)\*/g, '$1')
        // Supprimer les _ (italique)
        .replace(/_([^_]+)_/g, '$1')
        // Supprimer les ` (code)
        .replace(/`([^`]+)`/g, '$1')
        // Supprimer les liens markdown [text](url)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Supprimer les backslash d'échappement
        .replace(/\\/g, '');
}

/**
 * Envoie un message sur Telegram avec gestion des fallbacks
 */
async function sendTelegramMessage(
    telegramToken: string,
    chatId: string,
    message: string
): Promise<{ success: boolean; error?: string; mode?: string }> {
    const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    // ═══════════════════════════════════════════════════════════════
    // TENTATIVE 1 : Markdown (pour avoir le gras avec *)
    // ═══════════════════════════════════════════════════════════════
    try {
        console.log("[TELEGRAM] Tentative 1: Markdown...");
        const sanitizedMessage = sanitizeForTelegramMarkdown(message);

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: sanitizedMessage,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log("[TELEGRAM] Succès en Markdown");
            return { success: true, mode: 'Markdown' };
        }

        console.warn("[TELEGRAM] Échec Markdown:", result.description);
    } catch (e) {
        console.error("[TELEGRAM] Exception Markdown:", e);
    }

    // ═══════════════════════════════════════════════════════════════
    // TENTATIVE 2 : MarkdownV2 (plus strict mais plus de features)
    // ═══════════════════════════════════════════════════════════════
    try {
        console.log("[TELEGRAM] Tentative 2: MarkdownV2...");
        // MarkdownV2 nécessite d'échapper beaucoup plus de caractères
        const markdownV2Text = message
            .replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: markdownV2Text,
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log("[TELEGRAM] Succès en MarkdownV2");
            return { success: true, mode: 'MarkdownV2' };
        }

        console.warn("[TELEGRAM] Échec MarkdownV2:", result.description);
    } catch (e) {
        console.error("[TELEGRAM] Exception MarkdownV2:", e);
    }

    // ═══════════════════════════════════════════════════════════════
    // TENTATIVE 3 : Texte brut (garantit la réception)
    // ═══════════════════════════════════════════════════════════════
    try {
        console.log("[TELEGRAM] Tentative 3: Texte brut...");
        const plainText = stripMarkdown(message);

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: plainText,
                disable_web_page_preview: true,
            }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log("[TELEGRAM] Succès en texte brut");
            return { success: true, mode: 'Plain' };
        }

        console.error("[TELEGRAM] Échec total:", result.description);
        return { success: false, error: result.description };
    } catch (e) {
        console.error("[TELEGRAM] Exception texte brut:", e);
        return { success: false, error: 'Erreur réseau Telegram' };
    }
}

/**
 * GET - Récupère le brouillon depuis Redis
 * Usage: /api/admin/publish?key=ADMIN_SECRET
 */
export async function GET(req: NextRequest) {
    // 1. SÉCURISATION
    const apiKey = req.nextUrl.searchParams.get('key');
    if (apiKey !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
    }

    try {
        const redis = getRedis();

        // 2. Récupération du brouillon
        const draft = await redis.get('draft:daily:pronostics');

        if (!draft) {
            return NextResponse.json({
                draft: null,
                message: 'Aucun brouillon en attente.'
            });
        }

        // Le brouillon peut être une string ou déjà un objet selon Upstash
        let parsedDraft: any = null;
        if (typeof draft === 'string') {
            try {
                parsedDraft = JSON.parse(draft);
            } catch {
                parsedDraft = { raw: draft };
            }
        } else {
            parsedDraft = draft;
        }

        return NextResponse.json({ draft: parsedDraft });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("[PUBLISH GET] Erreur:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

/**
 * POST - Envoie le message sur Telegram et supprime le brouillon
 * Body: { secret: string, message: string }
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Parse du body
        let body: { secret?: string; message?: string };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Body JSON invalide.' }, { status: 400 });
        }

        const { secret, message } = body;

        // 2. SÉCURISATION
        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Secret invalide.' }, { status: 403 });
        }

        if (!message || message.trim() === '') {
            return NextResponse.json({ error: 'Le message est vide.' }, { status: 400 });
        }

        // 3. CONFIGURATION TELEGRAM
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramToken || !chatId) {
            return NextResponse.json({
                error: "Variables Telegram manquantes (TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID)."
            }, { status: 500 });
        }

        // 4. ENVOI SUR TELEGRAM (avec fallbacks automatiques)
        console.log("[PUBLISH] Envoi du message Telegram...");
        const sendResult = await sendTelegramMessage(telegramToken, chatId, message);

        if (!sendResult.success) {
            return NextResponse.json({
                error: `Échec d'envoi Telegram: ${sendResult.error}`,
                success: false
            }, { status: 500 });
        }

        // 5. NETTOYAGE - Suppression du brouillon
        const redis = getRedis();
        await redis.del('draft:daily:pronostics');
        console.log("[PUBLISH] Brouillon supprimé de Redis");

        // 6. MISE À JOUR DES STATS (optionnel)
        try {
            const currentTotal = await redis.get<number>('stats:total') || 0;
            await redis.set('stats:total', currentTotal + 1);
            console.log("[PUBLISH] Stats mises à jour");
        } catch (statsError) {
            console.warn("[PUBLISH] Erreur mise à jour stats:", statsError);
        }

        return NextResponse.json({
            success: true,
            message: "Message envoyé sur Telegram et brouillon supprimé.",
            mode: sendResult.mode
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("[PUBLISH POST] Erreur:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
