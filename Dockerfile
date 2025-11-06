# ---------- build the React UI ----------
FROM node:20.19-slim AS ui
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build:ui

# ---------- runtime for API ----------
FROM node:20.19-slim
WORKDIR /usr/src/app
    
# install API deps (prod only)
COPY package*.json ./
RUN npm ci --omit=dev
    
# copy API source
COPY src ./src
COPY views ./views
    
# copy UI build into the expected path
COPY --from=ui /app/frontend/dist ./frontend/dist
    
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
    