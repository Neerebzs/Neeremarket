FROM node:20-alpine

WORKDIR /app

# Use a reliable mirror and install dependencies
RUN echo "https://mirror.aarnet.edu.au/pub/alpine/v3.20/main" > /etc/apk/repositories && \
    echo "https://mirror.aarnet.edu.au/pub/alpine/v3.20/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 5 && \
    npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
