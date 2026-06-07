#!/bin/bash
# Backup script for PostgreSQL database
# Usage: ./scripts/backup.sh [output-dir]

set -e

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-finance_portfolio}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "=== Starting backup: $DB_NAME @ $TIMESTAMP ==="

# Full database backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump" \
  -v

echo "Backup created: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"

# Compress
gzip "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
echo "Compressed: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump.gz"

# Cleanup old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

# Backup manifest
cat > "$BACKUP_DIR/backup_${TIMESTAMP}.json" << EOF
{
  "database": "$DB_NAME",
  "timestamp": "$TIMESTAMP",
  "file": "${DB_NAME}_${TIMESTAMP}.dump.gz",
  "size_bytes": $(stat -f%z "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump.gz"),
  "retention_days": $RETENTION_DAYS
}
EOF

echo "=== Backup completed successfully ==="
