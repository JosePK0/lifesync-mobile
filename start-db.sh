#!/usr/bin/env bash
# Inicia la MariaDB local del proyecto (puerto 3307, datos en .mysql/data)
cd "$(dirname "$0")"
if mariadb --no-defaults -h127.0.0.1 -P3307 -ulifesync -p'LifeSync#2005' -e 'select 1' >/dev/null 2>&1; then echo "DB ya activa"; exit 0; fi
setsid nohup mariadbd --no-defaults --datadir="$PWD/.mysql/data" --port=3307 --bind-address=127.0.0.1 \
  --socket="$PWD/.mysql/run/m.sock" --pid-file="$PWD/.mysql/run/m.pid" > .mysql/run/log.txt 2>&1 < /dev/null &
sleep 5; echo "DB iniciada en 127.0.0.1:3307"
