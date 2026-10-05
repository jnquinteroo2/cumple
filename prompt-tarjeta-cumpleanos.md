# Prompt para Claude Code — Tarjeta de cumpleaños interactiva 3D

## 0. Preparación (ejecutar antes de pegar el prompt)

### Skills de diseño y animación (terminal, en la carpeta del proyecto)

```bash
npx skills@latest add emilkowalski/skills/skills/emil-design-eng
npx skills@latest add emilkowalski/skills/skills/animate
npx skills@latest add emilkowalski/skills/skills/animation-vocabulary
npx skills@latest add emilkowalski/skills/skills/review-animations
npx skills@latest add emilkowalski/skills/skills/mobile-native

npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "full-output-enforcement"
```

Cuando el instalador pregunte por el agente, elige **Claude Code**.

### Plugins (dentro de Claude Code)

```text
/plugin install frontend-design@claude-plugins-official
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/reload-plugins
```

### MCPs (terminal)

```bash
claude mcp add magicui -s user -- npx -y @magicuidesign/mcp@latest
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
claude mcp add playwright -s user -- npx @playwright/mcp@latest
npx shadcn@latest mcp init --client claude
```

Reinicia Claude Code y confirma con `/mcp`, `/plugin` y `/skills` que todo aparece activo. Luego pega el prompt de la sección 1.

---

## 1. Prompt

```markdown
# Rol
Eres un design engineer senior especializado en motion design y 3D para la web. Vas a construir una tarjeta de cumpleaños interactiva, divertida y memorable para un amigo o amiga.

# Skills y herramientas obligatorias
Antes de escribir código, carga y lee estas skills completas. Son obligatorias, no opcionales:

1. `design-taste-frontend` (Taste Skill) → dirección visual anti-genérica. Configura los diales así:
   - `DESIGN_VARIANCE: 7` (composición expresiva, no todo centrado y simétrico)
   - `MOTION_INTENSITY: 8` (es una experiencia de celebración, el movimiento es protagonista)
   - `VISUAL_DENSITY: 3` (aireado, la tarjeta respira)
2. `high-end-visual-design` (Taste Skill) → acabados premium: tipografía, sombras, profundidad, texturas.
3. `full-output-enforcement` (Taste Skill) → entrega archivos completos, sin `...` ni código truncado.
4. `emil-design-eng` (Emil Kowalski) → filosofía de animación y detalles invisibles.
5. `animate` (Emil Kowalski) → curvas, duraciones y springs correctas para cada animación.
6. `animation-vocabulary` (Emil Kowalski) → usa terminología precisa al planear cada movimiento.
7. `mobile-native` (Emil Kowalski) → sensación nativa en móvil: gestos, safe areas, tap highlight, haptics donde aplique.
8. `review-animations` (Emil Kowalski) → al final, audita todas las animaciones y corrige lo que falle.
9. `frontend-design` y `ui-ux-pro-max` → sistema de diseño (paleta, tipografía, espaciado, accesibilidad).

Jerarquía cuando dos skills choquen:
- Movimiento, easing, duración y springs → mandan las skills de Emil Kowalski.
- Paleta, tipografía, composición y estética → manda Taste Skill.
- Accesibilidad → manda `ui-ux-pro-max`.

MCPs:
- `magicui` → buscar e instalar componentes de Magic UI.
- `shadcn` → instalar componentes del registro `@magicui`.
- `context7` → consultar documentación actualizada de React Three Fiber, Drei, Motion, Tailwind v4 y Tone.js antes de usar sus APIs.
- `playwright` → verificación visual final en escritorio y móvil.

Presenta primero un plan breve (dirección visual elegida con los diales de Taste, estructura de carpetas, componentes y una tabla de animaciones con: elemento, propiedad, easing o spring, duración). Después impleméntalo completo sin pedirme confirmación.

# Stack (avanzado pero ligero)
- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 con `@tailwindcss/vite`
- shadcn/ui inicializado para usar el registro de Magic UI
- `three` + `@react-three/fiber` + `@react-three/drei` para la escena 3D
- `motion` (antes Framer Motion) para animaciones 2D y de interfaz
- `canvas-confetti` a través del componente Confetti de Magic UI
- `tone` para la música de fondo
- pnpm como gestor de paquetes

Ligereza:
- Carga la escena 3D con `React.lazy` + `Suspense` y precárgala en idle.
- Importa solo los helpers de Drei que uses.
- Importa `motion` desde `motion/react` y usa `LazyMotion` + `domAnimation`.
- Carga `tone` con import dinámico solo al pulsar "Abrir".
- Geometría del sobre procedural (sin modelos GLTF pesados).
- No agregues librerías fuera de esta lista sin justificarlo en el plan.
- Objetivo: JS inicial < 200 KB gzip.

# Componentes de Magic UI
Instala con `pnpm dlx shadcn@latest add`:
- `@magicui/confetti` y `@magicui/confetti-button` → explosión al abrir, cañones laterales, fuegos artificiales y confeti de emojis (🎉🎂🥳🎈)
- `@magicui/sparkles-text` → nombre del cumpleañero
- `@magicui/aurora-text` o `@magicui/animated-gradient-text` → título "¡Feliz cumpleaños!"
- `@magicui/text-animate` → mensaje que aparece palabra por palabra
- `@magicui/cool-mode` → partículas desde el cursor al hacer clic en botones
- `@magicui/particles` o `@magicui/meteors` → fondo animado
- `@magicui/shine-border` y `@magicui/magic-card` → borde brillante y spotlight en la tarjeta
- `@magicui/shimmer-button` o `@magicui/rainbow-button` → botón "Abrir"
- `@magicui/number-ticker` → contador de edad

Si un nombre no existe en el registro, búscalo con el MCP `magicui` y usa el equivalente más cercano. Ajusta los easings y duraciones de cada componente a las reglas de `animate`, no dejes los valores por defecto sin revisarlos.

# Experiencia (secuencia de animación)
1. **Pantalla inicial:** fondo con partículas y un sobre 3D flotando (R3F con `Float`, `Environment`, `ContactShadows`, luz suave). El sobre rota ligeramente siguiendo el puntero, o el giroscopio en móvil con permiso explícito en iOS. Texto: "Tienes un mensaje, {nombre} ✉️" y un botón "Abrir".
2. **Apertura:** al hacer clic, la solapa rota en el eje X con pivote en el borde superior usando spring, el sello de cera salta y la tarjeta sube desde el interior del sobre.
3. **Transición a 2D:** la tarjeta avanza hacia la cámara y hace crossfade a una tarjeta HTML con layout animation de `motion`, manteniendo la continuidad visual.
4. **Celebración:** al terminar la transición se disparan cañones laterales de confeti + fuegos artificiales durante ~3 s, arranca la música y aparecen en cascada el título, el nombre con sparkles y el mensaje con `text-animate`.
5. **Interacción posterior:**
   - Tilt 3D de la tarjeta con el puntero (perspective + rotateX/rotateY con spring) y spotlight.
   - Botón "Otra vez 🎉" que dispara confeti de emojis con `cool-mode`.
   - Globos SVG que suben y explotan con confeti pequeño al tocarlos.
   - Botón "Volver a cerrar" que reproduce la secuencia en reversa.

Reglas de movimiento (de las skills de Emil Kowalski):
- La secuencia de apertura es un "momento" de celebración y puede durar más; los controles de interfaz (botones, toggles) responden en menos de 300 ms.
- Entradas y salidas con ease-out fuerte, por ejemplo `cubic-bezier(0.23, 1, 0.32, 1)`. Nunca `ease-in` en UI.
- Springs con bounce sutil (0.1–0.3), salvo el salto del sello y los globos, que pueden ser más juguetones.
- Nunca animar desde `scale(0)`: empezar en `scale(0.95)` + `opacity: 0`.
- Feedback `:active` con `scale(0.97)` en todos los botones.
- Animar solo `transform` y `opacity`.
- Todas las animaciones deben ser interrumpibles (cerrar mientras se abre no rompe nada).
- Hover solo dentro de `@media (hover: hover) and (pointer: fine)`.

# Personalización por URL
- `?nombre=Ana` → nombre del cumpleañero (por defecto "Amig@")
- `&de=Nico` → quién envía (firma al final)
- `&edad=30` → opcional; si existe, muestra el contador con `number-ticker`
- `&msg=...` → mensaje opcional decodificado con `decodeURIComponent`, con un mensaje divertido por defecto

Sanitiza los valores (longitud máxima, sin HTML) y crea un hook tipado `useCardParams`. Actualiza `<title>` y las metaetiquetas Open Graph con el nombre para que el enlace se vea bien al compartirlo por WhatsApp.

# Música de fondo
- Melodía de "Happy Birthday" con Tone.js (`PolySynth` + bajo simple), en loop suave y volumen bajo.
- Solo arranca tras la interacción del usuario (botón "Abrir") por las políticas de autoplay.
- Botón flotante de sonido accesible (`aria-pressed`, ícono que cambia, fade de volumen al alternar).
- Si existe `public/music.mp3`, úsalo en lugar de la síntesis.

# Dirección visual
- Tono divertido, colorido y festivo, sin verse infantil ni recargado.
- Deja que `design-taste-frontend` proponga la paleta y justifícala. Evita el gradiente morado-azul genérico de IA. Referencia posible: coral, amarillo mantequilla y turquesa sobre un fondo oscuro profundo con grano sutil.
- Tipografía display con personalidad para el título (por ejemplo "Bricolage Grotesque", "Fraunces" o "Shrikhand") y una legible para el cuerpo, desde Google Fonts con `font-display: swap`.
- Microinteracciones en todos los elementos interactivos (hover, press, focus visible).
- Textos de la interfaz en español neutro.

# Calidad y rendimiento
- Responsive mobile-first, probado en 375 px, 768 px y 1440 px, respetando safe areas.
- `prefers-reduced-motion`: sin escena 3D ni confeti masivo; versión 2D con fades de opacidad.
- Fallback si WebGL no está disponible.
- `dpr={[1, 2]}` en el Canvas y `frameloop="demand"` o pausa del render loop cuando la pestaña no está visible.
- Accesible: contraste AA, navegación por teclado, `aria-label` en botones de solo ícono.
- Lighthouse ≥ 90 en Performance y Accessibility.

# Reglas de código
- **Nunca escribas comentarios en el código.** Ni `//`, ni `/* */`, ni `{/* */}` en JSX, ni comentarios en CSS o HTML. El código se explica con nombres claros de variables, funciones y componentes. Esto también aplica a los componentes instalados desde Magic UI: elimina sus comentarios.
- TypeScript estricto, sin `any`.
- Componentes pequeños con una sola responsabilidad.
- Centraliza easings, duraciones y springs en `src/lib/motion.ts` como constantes con nombre.
- Estructura sugerida:
  - `src/components/scene/` → `EnvelopeScene`, `Envelope`, `Letter`
  - `src/components/card/` → `BirthdayCard`, `Balloons`, `MuteButton`
  - `src/components/ui/` → componentes de Magic UI
  - `src/hooks/` → `useCardParams`, `useBirthdayMusic`, `useCelebration`
  - `src/lib/` → `motion.ts` y utilidades

# Entregables
1. Proyecto funcionando con `pnpm dev` y `pnpm build` sin errores ni warnings de TypeScript.
2. `README.md` breve: cómo ejecutar, cómo personalizar por URL y cómo desplegar en Vercel o Netlify.
3. Ejecuta `review-animations` sobre todo el proyecto y aplica las correcciones.
4. Verificación con Playwright: capturas del estado cerrado, durante la apertura y abierto, en escritorio y móvil. Corrige cualquier problema visual.
5. Antes de terminar, ejecuta `grep -rnE "//|/\*|\{/\*|<!--" src/` y elimina cualquier comentario que aparezca (ignora URLs dentro de strings).
```

---

## 2. Ejemplo de URL personalizada

```text
http://localhost:5173/?nombre=Laura&de=Nico&edad=28&msg=Que%20este%20a%C3%B1o%20venga%20cargado%20de%20aventuras
```

## Fuentes

- [Emil Kowalski — skills](https://github.com/emilkowalski/skills)
- [Taste Skill — Leonxlnx](https://github.com/Leonxlnx/taste-skill)
- [Magic UI — Confetti](https://magicui.design/docs/components/confetti)
- [Magic UI — Instalación](https://magicui.design/docs/installation)
- [Magic UI MCP](https://github.com/magicuidesign/mcp)
- [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [React Bits](https://reactbits.dev/)
