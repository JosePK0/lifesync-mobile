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
| `LIFE-16` | Sprint 1 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Inicializar aplicación móvil Expo con React Native, TypeScript estricto y gestor de paquetes pnpm (nodeLinker: hoisted) |
| `LIFE-17` | Sprint 1 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar contenedor seguro secureStorage.ts usando expo-secure-store (Android Keystore / iOS Keychain) |
| `LIFE-18` | Sprint 1 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar AuthContext con restauración de sesión segura, decodificación de expiración JWT y soporte offline |
| `LIFE-19` | Sprint 1 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Configurar navegación protegida en navigation/index.tsx separando AuthStack (Login/Register) y AppStack (MainTabs) |
| `LIFE-20` | Sprint 1 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Diseñar pantalla LoginScreen con validación de campos, manejo de errores de red y estados de carga |
| `LIFE-21` | Sprint 1 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Diseñar pantalla RegisterScreen con validación de contraseña segura y retroalimentación visual |
| `LIFE-22` | Sprint 1 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Documentar contratos iniciales de autenticación OAuth2/JWT y realizar prueba integral de registro e inicio de sesión |
| `LIFE-23` | Sprint 2 | Cristian Isaac Llanes Puc | @LlanesGood | Crear migración de tabla health_records con enum de tipos (blood_type, allergy, medication, contact) e índice compuesto |
| `LIFE-24` | Sprint 2 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar modelo HealthRecord y relación 1:N con User en Eloquent ORM |
| `LIFE-25` | Sprint 2 | Cristian Isaac Llanes Puc | @LlanesGood | Crear HealthRecordRequest con listas blancas de tipos, validación de horarios HH:MM, teléfonos y bloqueo de payloads XSS/SQLi |
| `LIFE-26` | Sprint 2 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar HealthRecordPolicy (Anti-IDOR) verificando que record->user_id coincida estrictamente con el usuario del token JWT |
| `LIFE-27` | Sprint 2 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar CRUD completo en HealthRecordController (index, store, show, update, destroy) forzando user_id desde el token |
| `LIFE-28` | Sprint 2 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Validar sanitización de entradas en servidor frente a SQL Injection y NoSQL/Array injection mediante consultas parametrizadas |
| `LIFE-35` | Sprint 2 | Jose Antonio De Jesus Pool Ku | @JosePK0 | Ejecutar pruebas de seguridad Anti-IDOR entre dos usuarios distintos verificando bloqueo 403 Forbidden en lectura, edición y borrado |
| `LIFE-29` | Sprint 2 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar cliente HTTP global Axios (api.ts) con interceptor automático Authorization: Bearer y cierre de sesión en 401 |
| `LIFE-30` | Sprint 2 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar esquemas de validación en cliente con Zod (validation.ts) para registro, login y formularios médicos |
| `LIFE-31` | Sprint 2 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar parser de respuestas de API (parsing.ts) con verificación de tipos en tiempo de ejecución |
| `LIFE-32` | Sprint 2 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Diseñar pantalla HomeScreen con resumen de grupo sanguíneo, contadores por categoría médica y sección de alertas críticas |
| `LIFE-33` | Sprint 2 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Diseñar pantalla RecordsScreen con filtros por categoría (Todos, Sangre, Alergias, Medicamentos, Contactos) y borrado con confirmación |
| `LIFE-34` | Sprint 2 | Alexis Alexander Bolio Chan | @AlexanderPlusD | Diseñar pantalla RecordFormScreen para creación y edición de antecedentes médicos, dosis, teléfono de contacto y hora de recordatorio |
| `LIFE-36` | Sprint 3 | Cristian Isaac Llanes Puc | @LlanesGood | Definir interfaz ExportStrategy en el backend para exportación polimórfica del historial médico |
| `LIFE-37` | Sprint 3 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar JsonExportStrategy y CsvExportStrategy con cabeceras MIME y escapado seguro de campos |
| `LIFE-38` | Sprint 3 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar ExportService y endpoint GET /api/records/export?format=json|csv protegido por JWT |
| `LIFE-43` | Sprint 3 | Cristian Isaac Llanes Puc | @LlanesGood | Crear migración y modelo Incident junto con endpoints GET/POST /api/incidents para rastreo GPS en la nube |
| `LIFE-46` | Sprint 3 | Cristian Isaac Llanes Puc | @LlanesGood | Implementar endpoints POST/GET /api/records/{record}/image con validación MIME jpg/png y almacenamiento privado por usuario |
| `LIFE-40` | Sprint 3 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar patrón Observer en móvil: AlertCenter (sujeto), AlertObserver (interfaz) y NotificationObserver |
| `LIFE-41` | Sprint 3 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar ReminderService con temporizador de verificación de medicamentos por hora (HH:MM) y programación diaria con expo-notifications |
| `LIFE-42` | Sprint 3 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar máquina de estados finita de permisos (permissionMachine.ts y hook usePermission) para Cámara, GPS y Notificaciones |
| `LIFE-48` | Sprint 3 | Luis Gerardo Diaz Pardenilla | @ShakerCandle694 | Implementar repositorio offline-first (RecordsRepository) con caché local en SecureStore, cola de operaciones pendientes y sincronización automática con NetInfo |
