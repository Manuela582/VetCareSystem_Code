FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV PORT=3006
EXPOSE 3006
CMD ["node", "src/index.js"]
