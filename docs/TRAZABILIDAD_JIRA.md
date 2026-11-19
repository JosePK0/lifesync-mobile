# Matriz de Trazabilidad Jira — LifeSync Mobile (`LIFE`)
| Clave Jira | Sprint | Responsable | Usuario GitHub | Tarea |
|---|---|---|---|---|
| `LIFE-5` | Sprint 1 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Inicializar repositorio monorepo LifeSync Mobile con estructura backend (Laravel 13) y mobile (Expo + TypeScript) |
| `LIFE-6` | Sprint 1 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Configurar README inicial, .gitignore de secretos/llaves y flujo de ramas GitFlow (main, develop, feature/*, release/*) |
| `LIFE-7` | Sprint 1 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Crear proyecto Scrum en Jira para LifeSync Mobile, asignar integrantes del equipo, épicas, historias y 4 sprints |
| `LIFE-8` | Sprint 1 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Configurar script start-db.sh y variables .env para MariaDB/MySQL con credenciales fuera del código fuente |
| `LIFE-9` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar patrón Singleton en DatabaseConnection.php y registrarlo en AppServiceProvider de Laravel |
| `LIFE-10` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Crear migración de tabla users con email único, password hash y timestamps en MySQL/MariaDB |
| `LIFE-11` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Configurar modelo User con cast hashed (bcrypt 12 rondas) garantizando cero contraseñas en texto plano |
| `LIFE-12` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar JwtService con firma criptográfica HMAC-SHA256 (HS256), expiración exp, emisor iss y validación de token |
| `LIFE-13` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Crear RegisterRequest y endpoint POST /api/auth/register con validación estricta de nombre, correo y fortaleza de contraseña |
| `LIFE-14` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Crear LoginRequest y endpoint OAuth 2.0 POST /api/oauth/token (grant_type=password) con protección contra timing attacks |
| `LIFE-15` | Sprint 1 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar middleware JwtAuthenticate y endpoint protegido GET /api/auth/me |
