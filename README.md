# Velkin — Motion Engineered

Sitio corporativo + backend + panel admin + infraestructura de Velkin, en un monorepo (pnpm + Turborepo).

```
velkin/
├─ apps/
│  ├─ web/      Next.js 15 (App Router) · TypeScript · Tailwind · next-intl · tema claro corporativo  → Vercel
│  ├─ admin/    Next.js — admin.velkin.com: leads por región/estado, CMS multilenguaje, descargas, usuarios, 2FA → EC2
│  └─ api/      NestJS 11 · Prisma · PostgreSQL · Redis · S3 · Resend/SES · Turnstile · Swagger → EC2
├─ packages/
│  └─ ui/       Tokens de marca (paleta, acento azul #1F3FA6) + Logo (isotipo V + wordmark)
├─ infra/       Docker Compose multiproyecto, Traefik (TLS wildcard), scripts EC2, backups, IAM
├─ .github/     CI (typecheck, tests, build, Lighthouse) + deploy backend (GHCR → SSM) + deploy web (Vercel)
└─ docs/        ART_DIRECTION.md (paleta, tipografía, fotos, pantallas) · LAUNCH_CHECKLIST.md
```

## Desarrollo local

Requisitos: Node 22+, pnpm 10, Docker.

```bash
pnpm install                                                   # también genera el cliente de Prisma
docker compose -f infra/docker-compose.dev.yml up -d          # Postgres + Redis

# API
cp apps/api/.env.example apps/api/.env                         # JWT_ACCESS_SECRET: openssl rand -hex 48
pnpm --filter @velkin/api exec prisma migrate dev --name init  # crea las tablas (commitea la carpeta migrations)
pnpm --filter @velkin/api build && pnpm --filter @velkin/api seed   # admin + contenido inicial
pnpm --filter @velkin/api dev                                  # http://localhost:4000/docs (Swagger)

# Web
cp apps/web/.env.example apps/web/.env.local                   # API_URL / NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm --filter @velkin/web dev                                  # http://localhost:3000

# Admin
cp apps/admin/.env.example apps/admin/.env.local               # NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm --filter @velkin/admin dev                                # http://localhost:3001
```

O todo junto: `pnpm dev`.

**¿Ya tenías la base creada con la versión anterior?** El esquema cambió (industrias, recursos, testimonios, certificaciones, cargo y rango de presupuesto). Ejecuta:

```bash
pnpm --filter @velkin/api exec prisma migrate dev --name cms-v2
pnpm --filter @velkin/api build && pnpm --filter @velkin/api seed
```

La web funciona **sin backend** (usa `apps/web/src/lib/seed.ts` y muestra un aviso de "contenido de ejemplo" en desarrollo).

## Qué hay en el sitio

- **Home:** hero con video/póster → posicionamiento → 5 servicios con foto → industrias → caso destacado con resultados → "Cómo construimos" (despiece por capas) → proceso → cifras → logos → testimonios → estándares y certificaciones → CTA.
- **Páginas:** servicios (capacidades, entregables, tecnologías, casos), industrias (problemas y soluciones), casos de estudio filtrables por industria/servicio/región con detalle completo, nosotros, recursos (artículos + white papers/fichas con descarga y captura opcional de email), solicitud de propuesta en una página, legales.
- **Movimiento:** sutil y con propósito (ver `docs/ART_DIRECTION.md`); todo respeta `prefers-reduced-motion`.
- **Fotos:** cada hueco muestra la etiqueta exacta de la foto que va ahí hasta que la subas desde el admin.

## Idiomas

`en` (principal) y `es`. Para añadir uno (p. ej. `pt`, `de`, `zh`, `ar`):
1. `apps/web/src/i18n/routing.ts` → añadir a `locales` (árabe/hebreo activan `dir="rtl"` solos; el CSS usa propiedades lógicas).
2. Copiar `apps/web/messages/en.json` → `messages/pt.json` y traducir.
3. Admin: `NEXT_PUBLIC_LOCALES=en,es,pt` → aparece la pestaña para traducir el contenido del CMS.
4. Para `zh`/`ar`: añadir `@fontsource/noto-sans-sc` / `noto-sans-arabic` e importarlas en el layout.

## Color de acento

Azul industrial `#1F3FA6` (aprobado). La alternativa naranja quemado `#B4410F` está documentada en `packages/ui/src/tokens.ts`; cambiar `--accent` en `apps/web/src/app/globals.css`.

## Despliegue

- Web → Vercel (ver `infra/README.md` §Frontend). Define `SITE_URL=https://velkin.com`.
- API + admin + analítica → una EC2 con Docker Compose + Traefik detrás de Cloudflare: [`infra/README.md`](infra/README.md).
- Antes de salir: [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).
