FROM node:20
WORKDIR /usr/src/app
RUN npm install -g @nestjs/cli
COPY . .
# Instalamos as dependências caso elas não existam
RUN npm install --quiet
CMD ["npm", "run", "start:dev"]