# RouteX Web — Next.js image
FROM node:20-alpine AS base
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY apps/web/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
