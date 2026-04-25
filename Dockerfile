FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache bash curl

COPY package.json package-lock.json* bun.lockb* ./

RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV DEPLOY_TARGET=vps

RUN npm run build
RUN cp dist/server/index.js dist/server/server.js

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
