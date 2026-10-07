# Checklist antes de producción

## Contenido (bloqueante)
- [ ] Reemplazar los **4 casos de ejemplo** (con sus métricas) por casos reales, o despublicarlos desde el admin.
- [ ] Cargar fotos reales según la lista de tomas de `docs/ART_DIRECTION.md` (ningún placeholder visible).
- [ ] Video y póster del hero en *Site settings*.
- [ ] Cifras reales en *Site settings* (en 0 la sección se oculta).
- [ ] Testimonios **con aprobación escrita** del cliente (nombre, cargo, empresa).
- [ ] Logos de clientes con permiso escrito.
- [ ] Certificaciones: solo las obtenidas, con número y vigencia. El bloque "Diseñamos conforme a" debe reflejar prácticas reales del equipo.
- [ ] Equipo real (retratos, cargos, LinkedIn).
- [ ] Al menos 3 artículos técnicos por idioma; white papers en PDF por idioma.
- [ ] Revisar textos legales con abogado para cada jurisdicción objetivo (UE/UK, EE. UU./California, Brasil, Colombia…).
- [ ] Variables: email de contacto, WhatsApp, LinkedIn, zona horaria de la empresa.

## Rendimiento (meta: Lighthouse ≥ 95, LCP < 2 s, CLS < 0,05)
Medido en local (`next start`, sin CDN, Lighthouse móvil con 4G lento simulado):
- Escritorio: 99–100 en las 4 categorías, LCP 0,45–0,9 s, CLS 0.
- Móvil: rendimiento 95–97 en la mayoría de páginas (alguna corrida de 89–93 por variación de la medición), accesibilidad/buenas prácticas/SEO 100, LCP 2,1–2,5 s, CLS 0.
- [ ] Repetir en producción (Vercel + Cloudflare, Brotli, edge cerca del visitante). Medir con WebPageTest desde Frankfurt, Singapur, São Paulo, Mumbai y Virginia.
- [ ] Póster del hero < 250 KB; video < 4 MB; fotos < 400 KB (Next genera AVIF/WebP).
- [ ] Lighthouse CI (`.github/lighthouserc.json`) en verde.
- [ ] Probar en un Android de gama baja real y con `prefers-reduced-motion`.

## Accesibilidad (WCAG 2.2 AA)
- [x] Contrastes verificados (ver tabla de paleta). Lighthouse a11y 100.
- [x] Skip link, foco visible azul, orden de títulos correcto, formularios con errores asociados.
- [ ] Recorrido completo con teclado y con lector de pantalla (VoiceOver + NVDA).
- [ ] Textos alternativos en todas las fotos reales (campo "alt" = título del contenido; revisar casos especiales).

## Seguridad
- [ ] Security Group: 80/443 solo Cloudflare (`infra/scripts/sync-cloudflare-sg.sh`), sin puerto 22 (SSM).
- [ ] Cloudflare: SSL Full (strict), WAF administrado, Bot Fight Mode, rate limit en `/v1/leads`, `/v1/auth/*` y `/v1/public/resources/*/download`.
- [ ] Admin detrás de Cloudflare Access + login + 2FA obligatorio para ADMIN.
- [ ] Secretos solo en SSM Parameter Store; contraseña del seed cambiada.
- [ ] Bucket de adjuntos privado y cifrado; CORS limitado al dominio.
- [ ] `pnpm audit` / Dependabot activos.

## SEO internacional
- [x] `hreflang` + `x-default`, canonical, sitemap multilenguaje, OG por idioma, schema.org (Organization, Service, Article/TechArticle, Product en fichas técnicas). Lighthouse SEO 100.
- [ ] Definir `SITE_URL=https://velkin.com` en Vercel (si no, los canonical apuntan a localhost).
- [ ] Verificar dominio en Google Search Console y Bing; enviar `sitemap.xml`.

## Legal / privacidad
- [x] Consentimiento opt-in, Global Privacy Control respetado, enlace "No vender/compartir" (CCPA).
- [x] Descargas de white papers: el email solo se guarda con consentimiento explícito; siempre se puede descargar sin suscribirse.
- [x] Borrado de leads (derecho de supresión) desde el admin.
- [ ] DPA firmados con AWS, Vercel, Cloudflare y Resend.
- [ ] Purga de leads > 24 meses (revisión trimestral).
- [ ] Colombia (Ley 1581): registro de bases de datos ante la SIC si aplica.

## Operación
- [ ] Backups diarios verificados con una restauración de prueba.
- [ ] Uptime multi-región con alertas; alarmas de CloudWatch (CPU, disco, status check).
- [ ] Migraciones Prisma commiteadas (ver README).
