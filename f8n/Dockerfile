FROM node:22-alpine AS base
WORKDIR /src

COPY package.json .

RUN npm install --force --ignore-scripts


COPY . .

RUN npm run build
EXPOSE 3000

CMD ["npm", "run", "start"]