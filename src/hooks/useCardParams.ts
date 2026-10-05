import { useEffect, useMemo } from "react"

import { EVENT } from "@/config/event"
import { sanitizeText } from "@/lib/sanitize"

export type CardParams = {
  guest: string
  host: string
}

const GUEST_LIMIT = 24

function readParams(search: string): CardParams {
  const params = new URLSearchParams(search)
  return {
    guest: sanitizeText(params.get("nombre"), GUEST_LIMIT),
    host: EVENT.host,
  }
}

function setMeta(selector: string, content: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) element.content = content
}

export function useCardParams(): CardParams {
  const cardParams = useMemo(() => readParams(window.location.search), [])

  useEffect(() => {
    const title = cardParams.guest
      ? `${cardParams.guest}, estás invitad@ al cumpleaños de ${cardParams.host} 🎉`
      : `Estás invitad@ al cumpleaños de ${cardParams.host} 🎉`
    const description = "Abre el sobre para ver la fecha, el lugar y confirmar tu asistencia."
    document.title = title
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[name="twitter:title"]', title)
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[property="og:url"]', window.location.href)
  }, [cardParams])

  return cardParams
}
