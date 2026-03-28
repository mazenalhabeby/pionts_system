#!/usr/bin/env bash
set -euo pipefail

# Database backup script — run daily via cron
# Usage: ./scripts/backup-db.sh
# Cron:  0 3 * * * /path/to/pionts/scripts/backup-db.sh

BACKUP_DIR="${BACKUP_DIR:-/var/backups/pionts}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/pionts}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pionts_${TIMESTAMP}.sql.gz"

pg_dump "$DB_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "pionts_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

echo "Cleaned up backups older than ${KEEP_DAYS} days"
