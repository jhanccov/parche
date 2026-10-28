FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @parche/api --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @parche/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
