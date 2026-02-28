import { Redis } from '@upstash/redis'

/**
 * Factory Redis centralisée — évite la duplication dans chaque route API.
 * Utilise le double fallback pour compatibilité avec différents noms de variables Upstash.
 */
export function getRedis(): Redis {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN

  if (!url || !token) {
    throw new Error('Configuration Redis manquante (UPSTASH_REDIS_REST_URL / TOKEN)')
  }

  return new Redis({ url, token })
}
