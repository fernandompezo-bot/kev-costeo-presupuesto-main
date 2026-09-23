# Dockerfile para despliegue en servidor web Linux / Cloud
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server.js ./
COPY public/ ./public/
COPY templates/ ./templates/
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
