# Velkin — Dirección de arte (versión corporativa, aprobada)

**Idea:** *Precisión silenciosa.* La confianza se gana con fotografía impecable, tipografía bien espaciada y datos concretos. Referencias de acabado: ABB, Siemens, Boston Dynamics, páginas de producto de Apple, Stripe, Linear, Teenage Engineering.

## Paleta

| Token | Valor | Uso | Contraste sobre `#FAFAF8` |
|---|---|---|---|
| `bg` | `#FAFAF8` | Fondo base | — |
| `surface` | `#FFFFFF` | Tarjetas, formularios, CTA final | — |
| `ink` | `#111111` | Titulares y texto | 18:1 |
| `ink-2` | `#3D3D3A` | Párrafos | 10,4:1 |
| `ink-3` | `#6B6B66` | Metadatos, etiquetas | 5,1:1 |
| `line` / `line-2` | `#E6E5E1` / `#D4D3CE` | Divisores 1 px, bordes de inputs | — |
| `graphite` | `#141414` | Hero, "Cómo construimos", cifras, footer | Texto `#EDEDEA` 15,7:1 |
| **`accent`** | **`#1F3FA6`** azul industrial profundo | CTAs, enlaces, cifras clave, foco | 8,7:1 (blanco sobre acento 9:1) |
| `accent-on-dark` | `#8FA6FF` | Acento dentro de secciones grafito | 5,9:1 sobre grafito |

Alternativa descartada (guardada en `packages/ui/src/tokens.ts`): naranja quemado `#B4410F`.
Reglas: el acento nunca va en fondos grandes; sin degradados de color, sin glow ni neón.

## Tipografía
- **Inter** variable con eje óptico: a partir de ~32 px se comporta como **Inter Display**. Gratuita (OFL), autoalojada, con fallback métrico para no mover el layout (CLS 0).
- Titulares: 600, tracking −2 a −2,5 %, interlineado 1,02–1,1. Cuerpo: 17 px / 1,6. Lead: 18–21 px.
- **IBM Plex Mono** 12,5 px solo en specs, códigos y cifras técnicas pequeñas.
- Árabe / chino: añadir `@fontsource/noto-sans-arabic` / `noto-sans-sc` cuando se activen esos idiomas (ya están en la pila de fuentes).

## Movimiento
- Aparición al hacer scroll: fade + 12 px, 500 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, escalonado 60–80 ms. Solo se anima lo que empieza **debajo** de la primera pantalla; lo visible al cargar nunca espera a JavaScript (protege LCP).
- Imágenes: reveal con máscara (900 ms). Hover: subrayado animado en enlaces, imágenes +2,5 %.
- Logo: una única articulación de la V al cargar (700 ms).
- Entre páginas: crossfade de 200 ms.
- "Cómo construimos": despiece de 4 capas ligado al scroll (sección fija en escritorio); en móvil y con movimiento reducido, estático.
- `prefers-reduced-motion`: todo estático. Video del hero: nunca en móvil, Save-Data ni movimiento reducido.

## Tratamiento fotográfico
Un mismo LUT para todo: 5600 K, saturación −10 %, negros ligeramente levantados, sin look teal/orange.

1. **Producto en estudio** — fondo gris continuo, luz principal suave lateral + contraluz, sombras limpias.
2. **Electrónica macro** — PCB a 45°, poca profundidad de campo, cobre y serigrafía nítidos.
3. **Planta / taller** — planos amplios, personas trabajando de verdad (nada de apretones de mano), luz industrial natural.
4. **Retratos del equipo** — fondo gris neutro, luz suave, 4:5, misma distancia focal para todos.

Exportar: AVIF/WebP (Next lo hace solo desde el original), máx. 2400 px de ancho, < 400 KB.

### Lista de tomas (cada hueco del sitio muestra su etiqueta hasta tener la foto)
| ID | Dónde | Toma | Formato |
|---|---|---|---|
| VIDEO 01 | Hero home | Robot o celda en operación, loop 10–15 s, sin audio | 16:9, < 4 MB + póster AVIF < 250 KB |
| S1 | Servicio Robótica | Cobot o cuadrúpedo en estudio | 4:3 |
| S2 | Servicio Automatización | Celda robótica en planta real, operario desenfocado | 4:3 / 16:9 |
| S3 | Servicio PCB | Macro de PCB a 45° | 4:3 |
| S4 | Servicio Software | Ingeniero con RViz/simulación y robot real al lado | 16:9 |
| S5 | Servicio Prototipado | CNC o granja de impresión trabajando | 16:9 |
| P* | Cada caso | Plano principal del sistema entregado + 4–8 de galería | 16:9 + 3:2 |
| I* | Cada industria | Sistema operando en su entorno | 3:2 |
| F1–F3 | Nosotros | Taller general, banco de electrónica, banco de motores | 4:3 |
| T* | Equipo | Retrato | 4:5 |

**Despiece:** las capas actuales son ilustraciones SVG isométricas. Para pasar a render real, exporta 4 renders PNG/WebP transparentes del mismo robot desde tu CAD (Onshape → KeyShot/Blender), misma cámara isométrica, uno por capa (estructura, actuadores, electrónica, software/sensores), y sustitúyelos en `apps/web/src/components/home/Exploded.tsx`.

## Tres pantallas clave

**Home — escritorio**
Hero grafito a pantalla completa (video + titular de 2–4 líneas, lead, CTA sólido "Hablar con un ingeniero" + secundario "Ver proyectos") → frase de posicionamiento con 3 puntos numerados → 5 tarjetas de servicio con foto (3 + 2) → rejilla de 8 industrias con iconos lineales → caso destacado (foto 16:10 + 3 resultados en azul) → despiece en grafito → proceso en timeline de 6 pasos con duraciones → cifras en grafito (ocultas si no hay datos) → logos (ocultos si no hay) → testimonios (ocultos si no hay) → estándares "Diseñamos conforme a" + certificaciones (solo reales) → CTA final → footer completo.

**Home — móvil**
Hero a pantalla completa con imagen fija (sin video), CTAs apilados; tarjetas de servicio en una columna; industrias en lista; despiece estático con las 4 capas y su descripción; timeline vertical; barra fija inferior "Hablar con un ingeniero" tras el primer scroll.

**Caso de estudio**
Volver a casos → industria → título → resumen; ficha lateral (cliente o "Cliente bajo NDA", país, año) → foto/video 16:9 → franja de 3–4 resultados cuantificados en azul → reto / solución / resultados → tabla de especificaciones en mono + servicios usados → galería → testimonio del cliente (si existe) → casos relacionados → CTA.

## Decisiones tomadas por confianza y rendimiento
1. Certificaciones: la sección solo muestra certificados reales y vigentes; mientras tanto se muestra el bloque honesto "Diseñamos conforme a" (IPC-2221, IPC-A-610, enfoque ISO 10218 / ISO 13849 / IEC 60204-1).
2. Testimonios, logos y cifras: solo reales y con permiso; si no hay, la sección no aparece.
3. El titular del hero no tiene animación de entrada (es el LCP).
4. El video del hero carga después del póster y nunca en móvil.
5. Sin cursor personalizado, terminal, decode, partículas, sonidos ni HUD.
