FROM node:22

WORKDIR /usr/src/backend

COPY package*.json ./

COPY . .

RUN npm install -g nodemon && npm install

EXPOSE 9019

CMD ["npm", "run", "dev"]