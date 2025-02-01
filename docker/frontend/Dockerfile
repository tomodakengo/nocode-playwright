FROM node:20.11.0-slim

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm install -g next

COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

CMD ["npm", "run", "dev"]
