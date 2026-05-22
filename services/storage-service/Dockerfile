FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV PORT=3004
EXPOSE 3004
CMD ["node", "src/index.js"]
