#!/usr/bin/env bash
# Daily Postgres backup for the ERP stack.
# Drop this in /opt/erp/scripts/backup-db.sh on the server and run via cron.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env"
BACKUP_DIR="/opt/erp/backups"
RETENTION_DAYS=14
CONTAINER="erp-postgres"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source <(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$ENV_FILE")

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/erp-$STAMP.dump"

docker exec "$CONTAINER" pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$OUT"
echo "Backup written: $OUT"

# Prune old backups
find "$BACKUP_DIR" -name 'erp-*.dump' -type f -mtime +$RETENTION_DAYS -delete
