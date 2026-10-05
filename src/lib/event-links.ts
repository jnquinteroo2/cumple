import type { BirthdayEvent, EventLocation } from "@/config/event"

function hasCoordinates(location: EventLocation): location is EventLocation & { latitude: number; longitude: number } {
  return location.latitude !== null && location.longitude !== null
}

export function googleMapsUrl(location: EventLocation) {
  const query = hasCoordinates(location) ? `${location.latitude},${location.longitude}` : `${location.name}, ${location.address}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function wazeUrl(location: EventLocation) {
  if (hasCoordinates(location)) return `https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`
  return `https://waze.com/ul?q=${encodeURIComponent(`${location.name}, ${location.address}`)}&navigate=yes`
}

export type RsvpAnswer = "yes" | "no"

export function whatsappRsvpUrl(event: BirthdayEvent, guest: string, answer: RsvpAnswer) {
  const signature = guest ? `Soy ${guest}. ` : ""
  const text =
    answer === "yes"
      ? `¡Hola, ${event.host}! ${signature}Confirmo que voy a tu cumpleaños 🎉`
      : `¡Hola, ${event.host}! ${signature}Esta vez no puedo ir a tu cumpleaños, pero te mando un abrazo 🎂`
  return `https://wa.me/${event.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`
}

export function formatEventDate(event: BirthdayEvent) {
  const date = new Date(event.startsAt)
  const day = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: event.timeZone,
  }).format(date)
  const time = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: event.timeZone,
  }).format(date)
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time }
}
