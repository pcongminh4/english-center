
if docker ps | grep -q "backend_blue"; then
    TARGET="backend_green"
    OLD="backend_blue"
else
    TARGET="backend_blue"
    OLD="backend_green"
fi

echo "Deploying to $TARGET..."

docker-compose up -d --build $TARGET

echo "Waiting for $TARGET to be ready..."
sleep 20 

echo "Running database migrations..."
docker compose exec -T $TARGET npx prisma migrate deploy

docker exec nginx_proxy nginx -s reload

echo "Stopping $OLD..."
docker-compose stop $OLD