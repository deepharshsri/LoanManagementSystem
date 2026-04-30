# Step 1 — Use Node 18 to build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install


ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .

RUN echo "Building with API URL: $VITE_API_BASE_URL"
RUN npm run build

# Step 2 — Use Nginx to serve built React app
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]