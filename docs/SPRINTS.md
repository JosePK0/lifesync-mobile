# Plan Scrum — LifeSync Mobile

| Sprint | Historias de usuario (HU) |
|---|---|
| 1 | HU-01 Registrarme · HU-02 Iniciar sesión (OAuth2/JWT) · HU-03 Sesión protegida en Keystore/Keychain · HU-04 Navegación Auth/App separada |
| 2 | HU-05 CRUD alergias/sangre/medicamentos/contactos · HU-06 Validación servidor + cliente · HU-07 Interceptor JWT · HU-08 Bloqueo IDOR |
| 3 | HU-09 Exportar JSON/CSV (Strategy) · HU-10 Alertas locales (Observer) · HU-11 Permisos con máquina de estados · HU-12 SOS con GPS y degradación gradual · HU-13 Escanear receta |
| 4 | HU-14 Pruebas unitarias · HU-15 Bloqueo HTTP (Network Security Config / ATS) · HU-16 SAST · HU-17 `.aab` / `.ipa` firmados |

## Flujo GitFlow
`main` (producción) ← `release/*` ← `develop` ← `feature/*`. Todo PR a `develop`/`main` requiere aprobación del Scrum Master (protección de rama en GitHub/GitLab).
