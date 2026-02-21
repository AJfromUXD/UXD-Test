# ── Stage 1: build the React client ──────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: build the Express server ────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy compiled server
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY server/package.json ./

# Copy built client into public/ so Express can serve it
COPY --from=client-build /app/client/dist ./public

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
