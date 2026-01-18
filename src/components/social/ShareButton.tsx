'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, Twitter, Copy, Check, X, Loader2, Send } from 'lucide-react' // J'ai ajouté Send ici
import html2canvas from 'html2canvas'
import { toast } from 'sonner'
import { Match, PronosticResponse } from '@/types'
import { TicketTemplate } from './TicketTemplate'

interface ShareButtonProps {
  match: Match
  pronostic: PronosticResponse
  ticketType: 'safe' | 'fun'
  homeLogo?: string
  awayLogo?: string
  leagueLogo?: string
}

export function ShareButton({
  match,
  pronostic,
  ticketType,
  homeLogo,
  awayLogo,
  leagueLogo
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // NOUVEAU STATE POUR TELEGRAM
  const [sendingTelegram, setSendingTelegram] = useState(false)
  
  const ticketRef = useRef<HTMLDivElement>(null)

  const homeLogoUrl = homeLogo || match.homeTeamLogo
  const awayLogoUrl = awayLogo || match.awayTeamLogo
  const leagueLogoUrl = leagueLogo || match.leagueLogo

  const generateImage = async () => {
    if (!ticketRef.current) return

    setIsGenerating(true)
    try {
      const images = ticketRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-ticket-template]')
          if (clonedElement) {
            (clonedElement as HTMLElement).style.position = 'static'
            ;(clonedElement as HTMLElement).style.left = 'auto'
          }
        }
      })

      const dataUrl = canvas.toDataURL('image/png')
      setGeneratedImage(dataUrl)
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Erreur lors de la generation de l\'image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenModal = async () => {
    setShowModal(true)
    setGeneratedImage(null)
    setTimeout(() => {
      generateImage()
    }, 200)
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    const safeName = `${match.homeTeam}_vs_${match.awayTeam}`.replace(/[^a-zA-Z0-9]/g, '_')
    link.download = `pronostic_${safeName}_${ticketType}.png`
    link.href = generatedImage
    link.click()

    toast.success('Image telechargee !')
  }

  // --- NOUVELLE FONCTION TELEGRAM ---
  const handleTelegramBroadcast = async () => {
    if (!generatedImage) return
    setSendingTelegram(true)

    try {
      // Convertir l'image générée (base64) en Blob pour l'envoi
      const res = await fetch(generatedImage)
      const blob = await res.blob()
      
      const formData = new FormData()
      formData.append('image', blob, 'ticket.png')

      // Appel à ton API
      const response = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Envoyé sur le canal Telegram VIP ! 🚀')
      } else {
        toast.error("Erreur lors de l'envoi Telegram")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erreur technique Telegram")
    } finally {
      setSendingTelegram(false)
    }
  }
  // ----------------------------------

  const handleCopyToClipboard = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Image copiee dans le presse-papiers !')
    } catch (error) {
      const text = `${match.homeTeam} vs ${match.awayTeam}\n${pronostic.vip_tickets[ticketType].market}: ${pronostic.vip_tickets[ticketType].selection}\nCote: ${pronostic.vip_tickets[ticketType].odds_estimated}\n\nGenere par La Passion VIP`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Texte copie dans le presse-papiers !')
    }
  }

  const handleShareTwitter = () => {
    const ticket = pronostic.vip_tickets[ticketType]
    const text = encodeURIComponent(
      `${match.homeTeam} vs ${match.awayTeam}\n${ticket.market}: ${ticket.selection} @ ${ticket.odds_estimated}\n\nAnalyse par La Passion VIP`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  return (
    <>
      <motion.button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white/80 hover:text-white rounded-lg transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Share2 className="w-4 h-4" />
        Partager
      </motion.button>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-dark-800 rounded-2xl border border-white/10 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Partager le pronostic</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Preview */}
              <div className="p-6 flex flex-col items-center">
                <div
                  className="absolute"
                  style={{ left: '-9999px', top: 0 }}
                  data-ticket-template
                >
                  <TicketTemplate
                    ref={ticketRef}
                    match={match}
                    pronostic={pronostic}
                    ticketType={ticketType}
                    homeLogo={homeLogoUrl}
                    awayLogo={awayLogoUrl}
                    leagueLogo={leagueLogoUrl}
                  />
                </div>

                {/* Image Preview */}
                <div className="relative w-full max-w-[350px] aspect-[4/5] bg-dark-700 rounded-xl overflow-hidden mb-6 border border-white/5">
                  {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-2" />
                      <span className="text-white/50 text-sm">Generation en cours...</span>
                    </div>
                  ) : generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Ticket preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30">
                      Apercu non disponible
                    </div>
                  )}
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Bouton Telegram (NOUVEAU) - Mis en premier et en bleu */}
                  <motion.button
                    onClick={handleTelegramBroadcast}
                    disabled={!generatedImage || isGenerating || sendingTelegram}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {sendingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Envoyer sur Telegram VIP
                  </motion.button>

                  <motion.button
                    onClick={handleDownload}
                    disabled={!generatedImage || isGenerating}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-neon-green text-dark-900 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4" />
                    Telecharger
                  </motion.button>

                  <motion.button
                    onClick={handleCopyToClipboard}
                    disabled={!generatedImage || isGenerating}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </motion.button>
                </div>

                {/* Twitter Button (Petit en bas) */}
                <motion.button
                  onClick={handleShareTwitter}
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-[#1DA1F2] hover:text-[#1a91da] transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Twitter className="w-3 h-3" />
                  Tweeter
                </motion.button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}