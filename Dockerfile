FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json server.js index.html admin.html krathongs.json stats.json ./
COPY css ./css
COPY js ./js
COPY assets ./assets

EXPOSE 8080

CMD ["node", "server.js"]
