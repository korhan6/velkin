#!/bin/bash
# Creates one database + one owner role per project on first boot.
# PROJECT_DATABASES="db1:user1:pass1,db2:user2:pass2"
set -euo pipefail
IFS=',' read -ra ENTRIES <<< "${PROJECT_DATABASES:-}"
for entry in "${ENTRIES[@]}"; do
  IFS=':' read -r db user pass <<< "$entry"
  [ -z "$db" ] && continue
  echo "→ creating database $db with owner $user"
  psql -v ON_ERROR_STOP=1 --username postgres <<-SQL
    DO \$\$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$user') THEN
        CREATE ROLE "$user" LOGIN PASSWORD '$pass';
      END IF;
    END \$\$;
    SELECT 'CREATE DATABASE "$db" OWNER "$user"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
    REVOKE ALL ON DATABASE "$db" FROM PUBLIC;
    GRANT CONNECT ON DATABASE "$db" TO "$user";
SQL
done
