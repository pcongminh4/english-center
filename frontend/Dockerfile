# Giai đoạn 1: Build
FROM node:18-alpine AS build-stage

WORKDIR /app

ARG VITE_BACKEND_URL
RUN echo "VITE_BACKEND_URL=$VITE_BACKEND_URL" > .env

# Copy file quản lý thư viện và cài đặt
COPY package*.json ./
RUN npm install

# Copy toàn bộ code frontend và build
COPY . .
RUN npm run build

# Giai đoạn 2: Production (Dùng Nginx)
FROM nginx:alpine

# Copy kết quả build từ stage trước vào thư mục mặc định của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy file cấu hình nginx của bạn (nếu có)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]