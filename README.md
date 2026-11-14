# LifeSync Mobile

App móvil de historial médico de emergencia. **Backend:** Laravel 13 + MySQL/MariaDB. **Móvil:** Expo (React Native + TypeScript).

```
backend/   API Laravel (JWT, Policies, Strategy, Singleton)
mobile/    App Expo (Observer, máquina de estados de permisos, SecureStore)
docs/      Plan de sprints, reporte SAST, guía de liberación
scripts/   sast.sh
start-db.sh  Inicia la MariaDB local del proyecto (127.0.0.1:3307)
```

## Ejecución rápida
```bash
./start-db.sh                                   # 1. base de datos
cd backend && php artisan migrate && php artisan serve --host=0.0.0.0 --port=8010   # 2. API
cd mobile && pnpm install && adb reverse tcp:8010 tcp:8010 && pnpm expo start --android  # 3. app
```
Usuario demo: `demo@lifesync.test` / `Demo12345` (`php artisan db:seed`).

## Cumplimiento de la guía

| Requisito | Dónde |
|---|---|
| Singleton (conexión BD) | `backend/app/Support/DatabaseConnection.php` + `AppServiceProvider` |
| Strategy (JSON/CSV) | `backend/app/Services/Export/*` |
| Observer (alertas) | `mobile/src/core/observers/*` |
| Máquina de estados de permisos | `mobile/src/core/permissions/permissionMachine.ts` |
| OAuth2 + JWT firmado | `POST /api/oauth/token` → `app/Support/JwtService.php` (HS256) |
| Contraseñas con hash fuerte | cast `hashed` (bcrypt) en `User`; nunca texto plano |
| JWT en hardware seguro | `mobile/src/data/secureStorage.ts` (expo-secure-store) |
| Navegación protegida | `mobile/src/navigation/index.tsx` (AuthStack / AppStack) |
| CRUD protegido por middleware | `routes/api.php` (`jwt`) + `HealthRecordController` |
| Validación servidor | `Http/Requests/*` (listas blancas, tipos estrictos); Eloquent parametrizado |
| Validación cliente | `mobile/src/domain/validation.ts` (Zod) |
| Interceptor HTTP global | `mobile/src/data/api.ts` |
| Anti-IDOR | `Policies/HealthRecordPolicy` + `user_id` forzado desde el token |
| Cámara y GPS declarados | `mobile/app.json` (AndroidManifest / Info.plist generados) |
| Push Notifications (Firebase FCM / APNs) | `backend/app/Services/Push/FcmService.php` + `mobile/src/core/notifications/pushService.ts` |
| Degradación gradual (GPS) | `HomeScreen.sos`, `ScanScreen` (galería si no hay cámara) |
| Modo avión | `RecordsRepository`: caché cifrada + cola de sincronización |
| Pruebas unitarias | `php artisan test` (19) · `pnpm test` (16) |
| Tráfico HTTP bloqueado | `mobile/plugins/withNetworkSecurity.js` |
| SAST | `scripts/sast.sh` → `docs/SAST_REPORT.md` |
| Artefactos firmados | `docs/RELEASE.md` |
