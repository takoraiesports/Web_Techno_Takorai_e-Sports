# Production image for the Next.js frontend. Build context is the repository root.
FROM node:22-alpine AS builder
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build --workspace=apps/frontend

FROM node:22-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/frontend/.next/static ./apps/frontend/.next/static
RUN mkdir -p ./apps/frontend/public && chown -R nextjs:nodejs ./apps/frontend
USER nextjs
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
