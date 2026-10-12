FROM node:20

WORKDIR /app

COPY nova-ui/package*.json ./

RUN npm install

COPY nova-ui/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]