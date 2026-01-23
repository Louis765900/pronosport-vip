import { NextRequest, NextResponse } from 'next/server'
import { Match, PronosticResponse, ChatMessage } from '@/types'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

interface ChatRequestBody {
  match: Match
  pronostic: PronosticResponse
  question: string
  history?: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const { match, pronostic, question, history = [] } = body

    if (!match || !pronostic || !question) {
      return NextResponse.json(
        { success: false, error: 'Donnees manquantes' },
        { status: 400 }
      )
    }

    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Cle API Perplexity non configuree' },
        { status: 500 }
      )
    }

    // Build context from match and pronostic
    const matchContext = `
Match: ${match.homeTeam} vs ${match.awayTeam}
Competition: ${match.league}
Date: ${match.date} a ${match.time}
Stade: ${match.stade}

Analyse deja effectuee:
- Contexte: ${pronostic.analysis.context}
- Score exact predit: ${pronostic.predictions.score_exact}
- Probabilite victoire domicile: ${pronostic.predictions.main_market.probability_percent}%

Ticket SAFE recommande:
- Marche: ${pronostic.vip_tickets.safe.market}
- Selection: ${pronostic.vip_tickets.safe.selection}
- Cote: ${pronostic.vip_tickets.safe.odds_estimated}
- Confiance: ${pronostic.vip_tickets.safe.confidence}%

Ticket FUN recommande:
- Marche: ${pronostic.vip_tickets.fun.market}
- Selection: ${pronostic.vip_tickets.fun.selection}
- Cote: ${pronostic.vip_tickets.fun.odds_estimated}
- EV: ${pronostic.vip_tickets.fun.ev_value}%
`

    const systemPrompt = `Tu es l'assistant expert de "La Passion VIP", specialise dans les paris sportifs.
Tu as acces au contexte d'un match et de son analyse complete.

CONTEXTE DU MATCH:
${matchContext}

REGLES:
- Reponds de maniere concise et professionnelle (2-3 phrases max)
- Base tes reponses sur l'analyse deja effectuee et de vrais stastiques
- Si tu ne sais pas, dis-le honnetement et reste professionnel
- Encourage le jeu responsable
- Utilise un ton amical et engageant 
- Reponds en francais 
- Utilise des donnees concretes quand disponibles 
- Ne repete pas l'analyse complete, reponds specifiquement a la question`

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ]

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Perplexity Chat Error:', errorBody)
      return NextResponse.json(
        { success: false, error: 'Erreur API Perplexity' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Reponse vide' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: content.trim()
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
