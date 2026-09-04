# Personal Trainer Platform

Plataforma web para gestión de alumnos, rutinas y seguimiento de progreso. Ver [`docs/producto.md`](docs/producto.md), [`docs/arquitectura.md`](docs/arquitectura.md) y [`docs/DESIGN.md`](docs/DESIGN.md) para el contexto completo del producto.

## Stack

- Next.js 16 (App Router) + React 19
- PostgreSQL (Neon) + Prisma 7
- Auth.js v5 (solo trainer/admin)
- Tailwind CSS v4 + shadcn/ui
- Zod para validación

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (recomendado: [Neon](https://neon.tech))

## Setup local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar variables de entorno:

   ```bash
   cp .env.example .env
   ```

   > Usar `.env` (no `.env.local`): la config de Prisma (`prisma.config.ts`) sólo carga `.env`.

3. Completar `.env` con:

   | Variable | Descripción |
   |---|---|
   | `DATABASE_URL` | Connection string de PostgreSQL (Neon) |
   | `AUTH_URL` | URL base de la app (`http://localhost:3000` en local) |
   | `AUTH_SECRET` | Secreto para Auth.js — generar con `openssl rand -base64 32` |
   | `SEED_ADMIN_EMAIL` | (Opcional) Email del trainer para el seed (`npx prisma db seed`) |
   | `SEED_ADMIN_PASSWORD` | (Opcional) Contraseña inicial del trainer (mínimo 8 caracteres) |
   | `SEED_ADMIN_NAME` | (Opcional) Nombre para mostrar del trainer |

4. Aplicar el schema de Prisma y generar el cliente:

   ```bash
   npx prisma migrate dev
   ```

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Lint con ESLint |
| `npx prisma migrate dev` | Aplica migraciones en desarrollo |
| `npx prisma studio` | Explorador visual de la base de datos |

## Estructura del proyecto

Ver la sección "Estructura de Carpetas" en [`docs/arquitectura.md`](docs/arquitectura.md).

## Deploy

Hosting en [Vercel](https://vercel.com), con Neon como base de datos. Configurar las mismas variables de entorno del paso 3 en el proyecto de Vercel antes del primer deploy.
