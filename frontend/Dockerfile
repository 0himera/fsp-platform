FROM oven/bun:1.3.11-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG BACKEND_INTERNAL_URL=http://app:8080
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
RUN bun run build

FROM oven/bun:1.3.11-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV BACKEND_INTERNAL_URL=http://app:8080
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["bun", "run", "start"]
