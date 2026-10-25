FROM node:20-alpine

WORKDIR /app

# Use a reliable mirror and install dependencies
RUN echo "https://mirror.aarnet.edu.au/pub/alpine/v3.20/main" > /etc/apk/repositories && \
    echo "https://mirror.aarnet.edu.au/pub/alpine/v3.20/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
