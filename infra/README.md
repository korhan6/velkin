# Infraestructura Velkine — guía paso a paso

Una sola EC2 aloja los backends de **todos** los proyectos Velkine. Cada proyecto vive en su contenedor y su red; Traefik enruta por subdominio con un certificado wildcard; Cloudflare va delante como CDN global, WAF y anti-DDoS.

```
           visitantes (todo el mundo)
                     │
          ┌──────────▼──────────┐
          │      Cloudflare      │  CDN 300+ ciudades · WAF · DDoS · Turnstile · Access (admin)
          └───┬─────────────┬───┘
   velkine.com │             │ *.velkine.com (proxied wildcard)
              ▼             ▼
         ┌────────┐   ┌──────────────── EC2 t4g.medium (us-east-1) ─────────────────┐
         │ Vercel │   │ Traefik :443 (wildcard TLS, solo IPs de Cloudflare)          │
         │  web   │   │  ├─ api.velkine.com        → site-api   ─┐ red velkin-site     │
         └────────┘   │  ├─ admin.velkine.com      → site-admin  │  └─ site-redis      │
                      │  ├─ analytics.velkine.com  → umami ──────┼─ red velkin-analytics│
                      │  └─ <proyecto>.velkine.com → <proyecto>  │                      │
                      │ PostgreSQL 16 (1 base + 1 usuario por proyecto)               │
                      └───────────────┬───────────────────────────────────────────────┘
                                      │ backups diarios 03:15 UTC
                               S3 us-west-2 (otra región)
```

## 1. Decisiones (y por qué)

**Región: `us-east-1` (N. Virginia).** Con Cloudflare delante, el contenido estático y cacheable se sirve desde el edge más cercano al visitante; el origen solo atiende peticiones dinámicas (API, admin). us-east-1 es la región más barata, con más servicios y la mejor conectividad trasatlántica (Europa ~80 ms) y hacia Latinoamérica (~60–150 ms). Si la mayoría de clientes fueran de Europa/Medio Oriente, usar `eu-central-1` (Frankfurt).

**Instancia: `t4g.medium` (Graviton, 2 vCPU, 4 GiB)** ≈ **24,5 USD/mes** on-demand en us-east-1. Con *Savings Plan* de 1 año baja ~35–40 %. Sube a `t4g.large` (8 GiB, ≈ 49 USD/mes) cuando tengas 3–4 proyectos con base de datos o la memoria pase de 75 %. Graviton requiere imágenes `arm64` (el workflow ya las construye).

| Concepto | USD/mes aprox. |
|---|---|
| EC2 t4g.medium on-demand | 24,5 |
| EBS gp3 40 GB | 3,2 |
| S3 (adjuntos + backups en otra región) | 1–3 |
| CloudWatch Logs (≈ 2 GB) | 1–2 |
| IPv4 pública | 3,6 |
| Cloudflare Free/Pro | 0 / 20 |
| Vercel Pro (web) | 20 por miembro (incluye 20 USD de uso y 1 TB de transferencia) |
| **Total** | **≈ 55–75** |

*Precios orientativos de oct-2026; verifica en la calculadora de AWS antes de comprar.*

**¿RDS o Postgres en el contenedor?** Para empezar, Postgres en el contenedor (más barato, backups a S3 incluidos). Pasa a **RDS/Aurora Serverless v2** cuando: un cliente exija SLA, la base supere ~20 GB, necesites point-in-time recovery o no quieras gestionar actualizaciones de Postgres. Solo cambias `DATABASE_URL`.

**¿Cuándo escalar?**
- **Multi-región** cuando la latencia de la API importe para clientes lejos de Virginia (p95 > 300 ms en Asia/Oceanía) o necesites alta disponibilidad real. Primer paso: réplica de lectura + segunda EC2 en `eu-central-1` o `ap-southeast-1` con Cloudflare Load Balancing por geografía.
- **ECS Fargate (o EKS)** cuando tengas > 5–6 backends, picos que requieran autoescalado, o un equipo que despliegue varias veces al día. Las imágenes Docker y los healthchecks ya son compatibles: solo cambias la orquestación.

## 2. Frontend: Vercel vs S3 + CloudFront

| | **Vercel (recomendado)** | S3 + CloudFront |
|---|---|---|
| Rendimiento mundial | Edge global, ISR, middleware i18n en el edge, imágenes optimizadas | CDN global, pero solo **export estático** |
| Funciones del sitio | Todas (detección de idioma, OG dinámico, revalidación al editar CMS, formulario con país por IP) | Pierdes middleware, ISR y OG dinámico; detección de idioma pasa a JS cliente |
| Coste | 20 USD/miembro/mes; transferencia extra 0,15 USD/GB pasado 1 TB | ~1–5 USD/mes a este volumen |
| Operación | Cero (preview por PR) | Tú gestionas invalidaciones, headers, redirecciones |

Vercel cuesta más pero conserva todas las funciones y la velocidad mundial; S3+CloudFront solo compensa con tráfico muy alto (varios TB/mes) o requisitos de residencia en AWS.

## 3. Puesta en marcha desde cero

### 3.1 Cloudflare
1. Añade `velkine.com` a Cloudflare y cambia los nameservers en tu registrador.
2. DNS: `velkine.com` y `www` → CNAME a Vercel (`cname.vercel-dns.com`), **proxied**. `*` (wildcard) → A con la IP elástica de la EC2, **proxied**.
3. SSL/TLS: modo **Full (strict)**, *Always Use HTTPS*, TLS 1.2 mínimo, HSTS.
4. Security: WAF *Managed Rules* ON, *Bot Fight Mode* ON, regla de rate limit para `api.velkine.com/v1/leads` (10 req/10 min por IP).
5. Zero Trust → Access → aplicación para `admin.velkine.com` (login por email/Google del equipo).
6. Crea un token API con permiso **Zone → DNS → Edit** solo para `velkine.com` (para el certificado wildcard).
7. Turnstile: crea un widget para `velkine.com` → site key (web) y secret (API).

### 3.2 AWS (consola o CLI)
1. **VPC/SG**: Security Group `velkin-origin` sin reglas de entrada (luego `sync-cloudflare-sg.sh` abre 80/443 solo para Cloudflare). **Sin puerto 22.**
2. **IAM role de instancia**: política `aws/ec2-instance-role-policy.json` (reemplaza `ACCOUNT_ID`) + `AmazonSSMManagedInstanceCore`.
3. **EC2**: Ubuntu 24.04 LTS arm64, `t4g.medium`, 40 GB gp3 cifrado, IMDSv2 obligatorio, el rol anterior, IP elástica.
4. **S3**: `velkin-leads` (privado, CORS/lifecycle de `aws/s3-leads-cors-lifecycle.json`), `velkin-media` (público vía Cloudflare en `media.velkine.com`), `velkin-backups-usw2` en **us-west-2** con versionado y lifecycle (Glacier IR a 30 días, expirar a 365).
5. **SES** (o Resend): verifica el dominio (DKIM/SPF/DMARC) y sal del sandbox.
6. **GitHub OIDC**: crea el proveedor `token.actions.githubusercontent.com` y el rol de `aws/github-deploy-role.json`.

### 3.3 Secretos en SSM Parameter Store (SecureString)
```bash
P() { aws ssm put-parameter --type SecureString --overwrite --name "$1" --value "$2"; }
P /velkin/core/CF_DNS_API_TOKEN   "<token cloudflare>"
P /velkin/core/ACME_EMAIL          "ops@velkine.com"
P /velkin/core/POSTGRES_SUPERUSER_PASSWORD "$(openssl rand -hex 24)"
P /velkin/core/SITE_DB_PASSWORD    "$(openssl rand -hex 24)"
P /velkin/core/SITE_REDIS_PASSWORD "$(openssl rand -hex 24)"
P /velkin/core/UMAMI_DB_PASSWORD   "$(openssl rand -hex 24)"
P /velkin/core/UMAMI_APP_SECRET    "$(openssl rand -hex 32)"
P /velkin/core/PROJECT_DATABASES   'velkin_site:velkin_site:${SITE_DB_PASSWORD},umami:umami:${UMAMI_DB_PASSWORD}'
P /velkin/core/BACKUP_BUCKET       velkin-backups-usw2
P /velkin/core/GHCR_USER           <tu-usuario-github>
P /velkin/core/GHCR_TOKEN          <PAT con read:packages>
# API (todas las variables de apps/api/.env.example salvo DATABASE_URL/REDIS_URL)
P /velkin/site-api/NODE_ENV production
P /velkin/site-api/JWT_ACCESS_SECRET "$(openssl rand -base64 64 | tr -d '\n')"
P /velkin/site-api/CORS_ORIGINS "https://velkine.com,https://www.velkine.com,https://admin.velkine.com"
P /velkin/site-api/COOKIE_DOMAIN ".velkine.com"
P /velkin/site-api/TURNSTILE_SECRET "<secret>"
P /velkin/site-api/MAIL_PROVIDER resend   # o ses
P /velkin/site-api/RESEND_API_KEY "<key>"
P /velkin/site-api/REVALIDATE_SECRET "$(openssl rand -hex 24)"   # el mismo valor va en Vercel
P /velkin/site-api/WEB_REVALIDATE_URL https://velkine.com/api/revalidate
P /velkin/site-api/REQUIRE_2FA_FOR_ADMINS true
P /velkin/site-api/SEED_ADMIN_EMAIL admin@velkine.com
P /velkin/site-api/SEED_ADMIN_PASSWORD "$(openssl rand -base64 18)"   # cámbiala tras el primer login
# … resto: ADMIN_URL, SITE_URL, S3_*, MEDIA_PUBLIC_URL, MAIL_FROM, MAIL_TEAM_TO, TELEGRAM_*
```

### 3.4 Servidor (vía SSM Session Manager)
```bash
aws ssm start-session --target i-XXXXXXXX
sudo -i
git clone https://github.com/<org>/velkin.git /opt/velkin   # o usa un deploy key de solo lectura
bash /opt/velkin/infra/scripts/bootstrap-ec2.sh
chown -R deploy:deploy /opt/velkin
sudo -iu deploy
cd /opt/velkin/infra
sed -i 's#ghcr.io/your-github-org#ghcr.io/<org>#' .env.base
./scripts/fetch-secrets.sh
docker compose up -d traefik postgres
docker compose logs -f traefik        # espera "certificate obtained" para *.velkine.com
```
Desde tu máquina: `SG_ID=sg-xxx ./infra/scripts/sync-cloudflare-sg.sh`.

### 3.5 Primer despliegue
1. En GitHub → *Settings → Environments → production*: secrets `AWS_DEPLOY_ROLE_ARN`, `EC2_INSTANCE_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; variables `DOMAIN=velkine.com`, `AWS_REGION=us-east-1`.
2. Asegúrate de haber commiteado `apps/api/prisma/migrations/*` (`prisma migrate dev --name init` en local).
3. Push a `main` → *Deploy backend* construye las imágenes arm64, las sube a GHCR y ejecuta `deploy.sh` por SSM (migraciones + rollout sin downtime).
4. Seed inicial (una vez): `docker compose run --rm site-api node dist/prisma/seed.js`.
5. Entra a `https://admin.velkine.com`, activa 2FA, cambia la contraseña y carga el contenido real.
6. Umami: entra a `https://analytics.velkine.com` (admin/umami → cámbiala), crea el sitio y copia el *website id* a Vercel (`NEXT_PUBLIC_UMAMI_WEBSITE_ID`).

### 3.6 Vercel (web)
Importa el repo → *Root Directory* `apps/web`, framework Next.js, *Install Command* `pnpm install --frozen-lockfile`. Variables: las de `apps/web/.env.example`. Dominio `velkine.com` + `www` (redirige www → apex). Región de funciones: `iad1` (junto a la API).

## 4. Operación diaria

| Tarea | Comando |
|---|---|
| Ver estado | `docker compose ps` |
| Logs en vivo | `docker compose logs -f site-api` · o CloudWatch Logs `/velkin/prod` |
| Desplegar a mano | `./scripts/deploy.sh site-api <sha> --migrate` |
| Rollback | `./scripts/deploy.sh site-api <sha-anterior>` |
| Backup manual | `./scripts/backup.sh` |
| Restaurar | ver comentario al final de `scripts/backup.sh` |
| Nuevo proyecto | `projects/_template.yml` (5 pasos en el encabezado) |

**Zero-downtime:** `deploy.sh` levanta un segundo contenedor con la imagen nueva, espera a que su healthcheck esté *healthy* (Traefik solo enruta a contenedores sanos), luego retira el viejo. Las migraciones deben ser *expand/contract* (añadir columnas antes de usarlas, borrar en un despliegue posterior).

## 5. Monitoreo
- **Uptime multi-región**: Better Stack, Checkly o UptimeRobot comprobando cada 1 min desde ≥ 3 continentes `https://velkine.com/en`, `https://api.velkine.com/health`, `https://admin.velkine.com/login`, con alertas a email/Telegram.
- **CloudWatch**: logs de todos los contenedores (driver `awslogs`), alarmas de CPU, disco (instala el CloudWatch Agent para métricas de disco/memoria) y `StatusCheckFailed` → SNS.
- **Cloudflare Analytics**: tráfico, amenazas bloqueadas y rendimiento por país.
