# Production image for the VPS (built by GitHub Actions, see .github/workflows/deploy.yml)
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
# Pages read the database at request time, so the build only needs a placeholder URL
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" DATABASE_URL_UNPOOLED="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate && npx next build

FROM base AS run
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# Prisma CLI for `migrate deploy` on start (same version as package.json)
RUN npm install -g prisma@6.19.3 && npm cache clean --force
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply any new database migrations, then start. If a migration fails the old container keeps serving.
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
