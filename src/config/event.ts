export type EventLocation = {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
}

export type BirthdayEvent = {
  host: string
  age: number | null
  startsAt: string
  endsAt: string | null
  timeZone: string
  location: EventLocation
  whatsappNumber: string
  message: string
}

export const EVENT: BirthdayEvent = {
  host: "Nicolás",
  age: null,
  startsAt: "2026-11-14T20:00:00-05:00",
  endsAt: null,
  timeZone: "America/Bogota",
  location: {
    name: "Nombre del lugar",
    address: "Dirección del lugar, Bogotá",
    latitude: null,
    longitude: null,
  },
  whatsappNumber: "573000000000",
  message: "Voy a celebrar otra vuelta al sol y no sería lo mismo sin ti. Trae tus mejores ganas de bailar, reír y comer torta.",
}
