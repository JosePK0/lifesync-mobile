#!/usr/bin/env bash
# Análisis estático de dependencias y secretos expuestos (Sprint 4 / SAST)
cd "$(dirname "$0")/.."
OUT=docs/SAST_REPORT.md
{
echo "# Reporte SAST — $(date '+%Y-%m-%d %H:%M')"
echo; echo "## Backend (composer audit)"; echo '```'; (cd backend && composer audit 2>&1); echo '```'
echo; echo "## Móvil (pnpm audit --prod)"; echo '```'; (cd mobile && pnpm audit --prod 2>&1 | tail -25); echo '```'
echo; echo "## Búsqueda de secretos hardcodeados"; echo '```'
grep -rIn --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.mysql --exclude-dir=.git --exclude-dir=storage --exclude-dir=firebase-push --exclude=.env --exclude=.env.example --exclude=SAST_REPORT.md --exclude=sast.sh \
  -E "(AKIA[0-9A-Z]{16}|BEGIN (RSA |EC )?PRIVATE KEY|password\s*=\s*['\"][^'\"]{4,}|secret\s*=\s*['\"][A-Za-z0-9]{12,})" backend/app backend/routes backend/config mobile/src mobile/app.json mobile/App.tsx && echo "(hallazgos arriba)" || echo "Sin secretos expuestos en código ni manifiestos."
echo '```'
} > "$OUT"
cat "$OUT"
