FROM node:20-alpine

WORKDIR /app

# Install Python3 for ML inference
RUN apk add --no-cache python3 py3-pip

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
