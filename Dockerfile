FROM node:12-alpine
WORKDIR /ethmon
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000 3001
RUN ln -s /config/config.json /ethmon/config.json
CMD ["node", "/ethmon/www/www.js"]
