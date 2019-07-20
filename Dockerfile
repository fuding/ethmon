FROM node:12
WORKDIR /ethmon
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000 3001
VOLUME ["/config"]
RUN ln -s /config/config.json /ethmon/config.json
CMD ["node", "/ethmon/www/www.js"]
