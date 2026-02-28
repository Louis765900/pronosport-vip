// ==========================================
// CLIENT HTTP GÉNÉRIQUE - API-Sports.io
// ==========================================
// Utilisé par tous les services sport (football, basketball, f1, etc.)

const API_KEY = process.env.API_FOOTBALL_KEY || ''

export interface APISportsResponse {
  response: unknown[]
  errors: Record<string, string>
  results: number
  paging?: { current: number; total: number }
}

/**
 * Effectue un appel à un subdomain API-Sports.io
 * @param host   Le subdomain, ex: 'v1.basketball.api-sports.io'
 * @param path   Le chemin + query, ex: '/games?date=2026-02-27'
 * @param revalidate  Cache Next.js en secondes (300 = 5min, 600 = 10min)
 */
export async function fetchFromAPISports(
  host: string,
  path: string,
  revalidate: number = 300
): Promise<APISportsResponse> {
  if (!API_KEY) {
    console.warn(`[API-Sports] API_FOOTBALL_KEY not configured for host: ${host}`)
    return { response: [], errors: {}, results: 0 }
  }

  const url = `https://${host}${path}`

  try {
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
        'x-apisports-host': host,
      },
      next: { revalidate },
    })

    if (!response.ok) {
      console.error(`[API-Sports] ${host} - HTTP ${response.status}: ${response.statusText}`)
      return { response: [], errors: { http: response.statusText }, results: 0 }
    }

    const data = await response.json() as APISportsResponse

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error(`[API-Sports] ${host} - API errors:`, data.errors)
      return { response: [], errors: data.errors, results: 0 }
    }

    return data
  } catch (error) {
    console.error(`[API-Sports] ${host} - Fetch error:`, error)
    return { response: [], errors: { fetch: String(error) }, results: 0 }
  }
}
