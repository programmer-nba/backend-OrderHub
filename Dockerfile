FROM node:22

WORKDIR /usr/src/backend

COPY package*.json ./

COPY . .

# ลบ node_modules และ package-lock.json ถ้ามีอยู่
RUN rm -rf node_modules package-lock.json && npm install

EXPOSE 9019
CMD ["npm", "run", "dev"]