# Imagen única para producción: compila la web y la sirve desde la API.
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps apps
RUN pnpm --filter @parche/web build && pnpm --filter @parche/api build
RUN pnpm --filter @parche/api deploy --prod --legacy /out

FROM node:22-alpine
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /app/apps/api/sql ./sql
COPY --from=build /app/apps/web/dist ./web
ENV NODE_ENV=production PORT=10000 WEB_DIST=/app/web
EXPOSE 10000
CMD ["node", "dist/index.js"]
