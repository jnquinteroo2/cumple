# Invitación de cumpleaños 3D

Invitación interactiva: un sobre 3D se abre, la carta vuela hacia la cámara y se transforma en una invitación con fecha, lugar, cuenta regresiva, botones para llegar y confirmación por WhatsApp.

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, React Three Fiber + Drei, Motion, Magic UI (vía shadcn), canvas-confetti y Tone.js.

## Ejecutar

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Datos del evento

Edita `src/config/event.ts`:

| Campo | Uso |
| --- | --- |
| `host` | Tu nombre |
| `age` | Edad que cumples (`null` para ocultarla) |
| `startsAt` | Fecha y hora de inicio en ISO con zona horaria, por ejemplo `2026-11-14T20:00:00-05:00` |
| `endsAt` | Hora de fin opcional; si es `null`, la fiesta se considera en curso durante 6 horas |
| `location` | Nombre, dirección y, opcionalmente, latitud y longitud para Google Maps y Waze |
| `whatsappNumber` | Tu número con indicativo, sin `+` ni espacios, por ejemplo `573001234567` |
| `message` | Texto de la invitación |

## Personalizar por invitado

Agrega `?nombre=` al enlace para saludar a cada invitado y que su nombre aparezca en el mensaje de confirmación de WhatsApp:

```
https://tu-sitio.vercel.app/?nombre=Laura
```

Sin el parámetro, la invitación funciona como genérica.

## Música

Por defecto suena "Happy Birthday" generada con Tone.js después de pulsar "Abrir invitación". Si colocas un archivo en `public/music.mp3`, se usa ese archivo en su lugar.

## Accesibilidad y rendimiento

- Con `prefers-reduced-motion` o sin WebGL se muestra una versión 2D con fundidos de opacidad y confeti reducido.
- La escena 3D, Tone.js y las funciones de layout de Motion se cargan de forma diferida. El JS inicial ronda los 120 KB gzip.
- La tecla Escape cierra la tarjeta en cualquier momento de la secuencia.

## Desplegar

**Vercel**: importa el repositorio. Vercel detecta Vite automáticamente (build `pnpm build`, salida `dist`).

**Netlify**: build `pnpm build`, carpeta de publicación `dist`. También puedes arrastrar la carpeta `dist` a app.netlify.com/drop.

### Vista previa en WhatsApp

`index.html` incluye etiquetas Open Graph y `public/og-image.png`. La app actualiza el título con el nombre al cargar, pero WhatsApp lee el HTML sin ejecutar JavaScript, así que la vista previa muestra el título genérico. Para un título con el nombre en la vista previa necesitas generar el HTML en el servidor (por ejemplo, una Edge Function de Vercel o Netlify que reescriba las metaetiquetas según `?nombre=`).

Antes de desplegar, cambia `og:image` en `index.html` por la URL absoluta de tu dominio (por ejemplo `https://tu-sitio.vercel.app/og-image.png`): WhatsApp ignora rutas relativas.
# cumple
