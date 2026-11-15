# Plan de liberación — LifeSync

## 1. Auditoría previa
```bash
./scripts/sast.sh                      # genera docs/SAST_REPORT.md
(cd backend && php artisan test)       # 19 pruebas
(cd mobile && pnpm test)               # 16 pruebas
```

## 2. Android App Bundle (.aab) firmado
```bash
export ANDROID_HOME=$HOME/Android/Sdk JAVA_HOME=/usr/lib/jvm/java-17-openjdk
cd mobile
APP_VARIANT=production EXPO_PUBLIC_API_URL=https://TU-DOMINIO/api npx expo prebuild --platform android --clean
../scripts/sign-android.sh     # crea keystore (una vez) y configura firma Release
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```
En producción `APP_VARIANT=production` elimina la excepción de localhost: **todo** el tráfico en claro queda bloqueado.

## 3. iOS (.ipa)
Requiere macOS + cuenta Apple Developer: `eas build -p ios --profile production` (usa `eas.json`).
`NSAppTransportSecurity` ya se genera con `NSAllowsArbitraryLoads=false`.

## 4. Backend en producción
HTTPS obligatorio (Nginx/Caddy + certificado), `APP_DEBUG=false`, `JWT_SECRET` ≥ 32 bytes aleatorios, `php artisan migrate --force`.
