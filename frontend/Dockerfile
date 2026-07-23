# Stage 1: Build Frontend Production Artifacts
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Production Nginx Server
FROM nginx:1.27-alpine AS runner

# Remove default Nginx site configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy production build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
