# Use Node.js LTS (Long Term Support) version
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

EXPOSE 3000

# Start the application
CMD [ "npm", "start" ] 