# Scripts

## Backup

```bash
# Manual backup
./scripts/backup.sh ./backups

# Automatic backup (cron)
0 2 * * * /path/to/scripts/backup.sh /path/to/backups

# Restore
./scripts/restore.sh ./backups/finance_portfolio_20260101_120000.dump.gz
```

## Load Testing (k6)

```bash
# Install k6
# macOS: brew install k6
# Linux: https://k6.io/docs/getting-started/installation/

# Run load test
k6 run scripts/k6-load-test.js

# Run with custom URL
BASE_URL=http://localhost:3007/api/v1 k6 run scripts/k6-load-test.js

# Run with more virtual users
k6 run --vus 50 --duration 5m scripts/k6-load-test.js
```

## Docker Build

```bash
# Build backend with cache
docker compose -f docker-compose.prod.yml build --no-cache backend

# Build with cache (faster)
docker compose -f docker-compose.prod.yml build backend
```
