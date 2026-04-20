#!/bin/bash

# 1. Xác định TARGET (Blue hoặc Green)
if docker ps | grep -q "backend_blue"; then
    TARGET="backend_green"
    OLD="backend_blue"
else
    TARGET="backend_blue"
    OLD="backend_green"
fi

echo "Deploying to $TARGET..."

# 2. Kéo Image mới nhất từ Docker Hub về trước khi chạy
# (Lệnh này đảm bảo VPS lấy đúng bản vừa được GitHub Actions push lên)
docker compose pull $TARGET

# 3. Chạy container mới (Bỏ flag --build vì đã build trên GitHub rồi)
docker compose up -d --remove-orphans $TARGET

echo "Waiting for $TARGET to be ready..."
sleep 20 

# 4. Chạy database migrations
echo "Running database migrations..."
docker compose exec -T $TARGET npx prisma migrate deploy || echo "Migration skipped or failed, but continuing..."

# 5. Reload Nginx để cập nhật upstream
docker exec nginx_proxy nginx -s reload

# 6. Dừng container cũ
echo "Stopping $OLD..."
docker compose stop $OLD

echo "Zero Downtime Deployment Finished!"