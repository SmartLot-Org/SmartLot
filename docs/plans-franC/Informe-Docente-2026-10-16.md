Informe-Docente
Informe Docente — SmartLot-Org / SmartLot
Actualizado 2026-10-16 tras re-entrega del DDL (solo área Base de datos). El grupo commiteó 6dc8c20
("pedido polshu") con docs/schema.sql, docs/roles.sql y docs/source-permissions.json. Se re-auditó y se
verificó por ejecución únicamente el área Base de datos (2.8). El resto de las áreas sigue evaluado sobre 86b9c11 y
no cambia.
CONFIDENCIAL — uso docente. Contiene ubicaciones exactas, evidencia y preguntas de defensa oral. No
compartir con alumnos.
Fecha de auditoría: 2026-10-16
Repos auditados:
Backend: https://github.com/SmartLot-Org/SmartLot_API, rama master, último commit 86b9c11 (2026-10-
16); el área Base de datos se re-auditó sobre 6dc8c20 (re-entrega del DDL, 2026-10-16). El código vive en la
subcarpeta SmartLot_API/.
Frontend: https://github.com/SmartLot-Org/SmartLot.git, rama main, último commit 30be227 (2026-10-12).
Los dos se clonaron con --depth 50. Los commits frontera 66e842d (BE) y 9a0fa4b (FE) son raíces
injertadas del clon shallow, no commits gigantes, y no se usaron como señal.
Alcance: completo (backend + frontend + base de datos). La base de datos se evaluó sobre el DDL re-entregado,
verificado por ejecución (B1 resuelto, ver Precondiciones).
Stack detectado: Node + Express 5 (ESM), pg contra Supabase/PostgreSQL más supabase-js para auth admin, JWT
en cookies httpOnly, Mercado Pago, Mailtrap y Google Maps. Frontend con Vite 8 + React 19 (JS), react-router 7 con
lazy(), Context para el estado global, axios con un cliente único y caché propia, Tailwind v4 más unos 63 CSS por
vista. Unos 136 endpoints en 17 routers, 24 tablas y unas 44k líneas de código propio entre los dos repos.
Precondiciones: sin bloqueantes. Hay fallas B: B1 (DDL no reproducible; resuelta con la re-entrega 6dc8c20), B2 (BE
sin README, ALTO), B3 (BE sin .env.example, ALTO), B5 (artefactos de depuración, MEDIO) y B7 (el 59 % de los
commits son de un autor no atribuible, "Android Studio"). No se encontraron secretos filtrados en el árbol ni en el
historial disponible.
1. Resumen ejecutivo
SmartLot es el proyecto más ambicioso que puede esperarse en un PDP. Tiene multi-tenant con 5 roles, reservas con QR y
retención de pago, integración real con Mercado Pago (webhook firmado con HMAC), cuentas corrientes entre empresas y
garages, impersonación de superadmin, caché con dedupe en el front y tests. Los fundamentos están por encima de la
media: capas reales en el BE, error handler central sobre Express 5, queries 100 % parametrizadas, bcrypt, JWT en cookies
httpOnly con refresh rotado y token_version, CHECKs de dominio sofisticados en la base, y un cliente HTTP y una caché de
nivel senior en el FE.
El problema es la coherencia. El proyecto se construyó por capas y por sesiones que nunca se reconciliaron. Los módulos
más delicados (pagos, cotización de reservas) son justamente los que rompen las capas y la autorización. Conviven tres
"dialectos" de controller, tres generaciones de servicios en el FE, cinco estrategias de PK y cuatro sistemas de color. Además,
la documentación (ADR-004, ADR-005, DESIGN.md, comentarios como el de dbClient.js) afirma cosas que el código
desmiente. El detector de IA ve indicios FUERTES en zonas acotadas: pagos, dbClient.js, documentación FE, tests que
hacen regex sobre el código fuente y field-guessing en las vistas. A eso se suma que el 59 % de los commits no se puede
atribuir a una persona.

Ideas fuerza para la corrección:
1. Autenticación ≠ autorización. El módulo de pagos solo exige estar logueado y varias escrituras no aplican el tenant
que sí aplican las lecturas. Es lo único que no puede quedar como está.
2. El servidor es la fuente de verdad. Los montos de pago del admin, los consumos que quedan saldados y la
capacidad del garage los decide el cliente.
3. Una sola forma de hacer cada cosa. Los helpers y las abstracciones buenas ya existen (throwError, formatARS,
ModalPortal, EmptyState, tenantFilter, tokens @theme). Falta adoptarlos en todo el proyecto y podar las copias.
Notas por área (rúbrica)
Área Peso Nota Sujeta a defensa Justificación en una línea
Repositorio y 10 % 6/10 Sí (atribución B7) El FE es ejemplar y no hay secretos, pero el BE no tiene README ni
configuración .env.example (2 ALTO), tiene restos de depuración y hay unas 52k líneas de
skills de terceros versionadas.
Arquitectura 13 % 6/10 Sí (pagos, Hay capas reales en los CRUD, pero varios ALTO: el dominio de pagos vive en el
backend dbClient.js) controller (con un bug transaccional), la regla de cotización está en un
repository y hay 2 God services.
API REST 13 % 6/10 Sí (pagos) Buena base (201, 409, error handler), pero hay 3 ALTO: los repos tragan errores
y devuelven 404 o 500 a ciegas, hay PUT que pisan columnas y un 404 que sale
como 500 y desloguea.
Seguridad 15 % 5/10 Sí (pagos) Los fundamentos son muy buenos (sin SQLi, bcrypt, JWT bien), pero hay 1
CRITICO (refund sin rol ni ownership) y 3 ALTO de autorización y tenant. La
rúbrica (CRITICO subsanable + varios ALTO) la deja en el piso de la banda 5-6.
Arquitectura 10 % 6/10 Sí (field-guessing, Infraestructura senior (cliente, caché, AuthProvider). Falta el contrato de datos
frontend ADR-004) entre servicios y vistas, el retorno de MP del admin apunta a una ruta
inexistente y el usuario tiene 3 fuentes de verdad.
Componentes y 9 % 5/10 Sí (leve) Buenas piezas compartidas (EmptyState, formularios de garage), pero hay 6
reutilización God components y familias clonadas por rol que ya divergieron con bugs
reales (editar_zona).
Estándares, estilos 8 % 5/10 Sí (DESIGN/ADR) Hay 2 ALTO de lógica con consecuencia persistida calculada en el cliente, 5
y lógica en el FE reglas DIVERGE y 5 SOLO FE, y un sistema de diseño documentado que los
paneles no usan.
Base de datos 13 % 7/10 Sí (DDL, roles) El dominio y los constraints valen 8 y el esquema ahora se levanta desde el
repo (verificado por ejecución). Resta: la relación pago↔consumo con un
regex sobre un string (ALTO), fuente de verdad ambigua (MEDIO), vocabulario
de roles seed ≠ backend (MEDIO) e incoherencia de nombres, tipos y estados.
Calidad de código 9 % 5/10 Sí (tests source) Los helpers buenos existen pero no se adoptan. La fábrica de errores está
copiada 25 veces, hay 3 generaciones de servicios FE y helpers de vista
clonados de 7 a 12 veces que ya divergieron.
Ponderada 100 5,7/10 Sí Proyecto ambicioso con fundamentos sólidos, penalizado por autorización en
% pagos y por la falta de coherencia entre módulos.
Cálculo: 6·0,10 + 6·0,13 + 6·0,13 + 5·0,15 + 6·0,10 + 5·0,09 + 5·0,08 + 7·0,13 + 5·0,09 = 5,72 → 5,7 (antes 5,59 → 5,6, con
Base de datos en 6).
Ajustes respecto de lo que sugirieron los agentes: Seguridad baja de 6 a 5. Un CRITICO más tres ALTO de autorización
ubican el área en el piso de la banda "5-6", aunque los fundamentos sean de 8. El resto de las notas coincide con las
sugeridas, que ya respetaban la banda de la rúbrica. Todas las áreas quedan sujetas a defensa: el veredicto de IA es
FUERTE en zonas que tocan casi todas las áreas, y además hace falta establecer la autoría de "Android Studio" antes de
confirmar cualquier nota.

Top 5 hallazgos
# Severidad Hallazgo Ubicación
1 CRITICO Cualquier usuario autenticado (alcanza con autorregistrarse) paymentController.js:461-470; montaje
puede reembolsar cualquier pago, sin chequeo de rol ni de app.js:98-102 (verificado por el orquestador)
propiedad.
2 ALTO El monto de los pagos de admin y los consumos que quedan admin_pagos.jsx:206-213 →
"PAGADA" los arma el cliente. El prefijo ADMIN-PAGO- activa paymentController.js:265-306 →
el tope de $0,10 siempre, y con $0,10 se salda un período cuentaCorrienteService.js:59-76
entero.
3 ALTO Escrituras sin aislamiento por empresa: un admin edita o borra sedeService.js:16-26,
sedes, da de baja usuarios (incluido el superadmin) y cancela usuarioService.js:375-393, 588-599,
reservas de otras empresas. reservaService.js:301-315, 367-380
4 ALTO El dominio de pagos completo vive en el controller (14 queries, paymentController.js:21-161 (bug en :39, :59
transacciones). savePaymentRecord recibe el cliente vs :131)
transaccional pero escribe con pool, así que un ROLLBACK
no deshace el UPDATE.
5 ALTO Los repositories se tragan los errores de DB y devuelven null empresaRepository.js:28 (patrón),
(unas 70 copias), y el controller lo traduce a ciegas en 404 o marcaController.js:37-38, 48-49
500: una caída de la base responde "no existe" y una violación
de constraint, 500.
Le siguen de cerca (también ALTO): los PUT que validan como parciales pero ejecutan un UPDATE total y dejan
sedes.id_empresa en NULL, la relación pago↔consumo modelada con FK + jsonb + regex sin tabla puente, y la copia
editar_zona que manda al superadmin a pantallas de admin.
Cambio por la re-entrega del DDL: el ALTO "esquema no reproducible" salió del top 5. Con docs/schema.sql +
docs/roles.sql la base se levanta limpia (verificado por ejecución), así que baja a MEDIO "fuente de verdad
ambigua" (ver 2.8).
2. Hallazgos por área
Convención: rutas del BE relativas a SmartLot_API/src/ salvo indicación; rutas del FE relativas a frontend/src/.
Cuando dos o más agentes reportaron lo mismo, queda una entrada con el dueño temático y se acredita al resto.
2.1 Repositorio y configuración — 6/10
[ALTO] Backend sin README (falla B2)
Evidencia: git ls-files | grep -i readme en backend/ solo devuelve SmartLot_API/migrations/README.md. En la
raíz está SmartLot_API/AGENTS.md, que es una guía de 29 líneas para agentes de IA. El script "app": "node
./src/app.js" (package.json:15) no está documentado y no hay start ni dev.
Impacto: nadie puede levantar la API leyendo el repo. El README del FE es completo, así que el equipo sabe hacerlo y
no lo aplicó en el BE.
Concepto: el README como contrato de onboarding.
[ALTO] Backend sin .env.example aunque el código lee 23 variables (falla B3)

Evidencia: git grep -ohE "process\.env\.[A-Z_0-9]+" -- src scripts | sort -u | wc -l → 23 (DATABASE_URL,
JWT_SECRET, JWT_REFRESH_SECRET, SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN, EMAIL_PASS…). Lo llamativo es
que la lista completa ya existe en scripts/check-env.cjs:6-30 (REQUIRED_VARS, RECOMMENDED_VARS,
FORBIDDEN_IN_PROD).
Impacto: configurar el entorno obliga a leer código. Un script que valida el .env no reemplaza la plantilla que lo
documenta.
[MEDIO] .gitignore del BE de 2 líneas, con restos de depuración commiteados (falla B5)
Evidencia: el .gitignore solo tiene node_modules/ y .env. En la raíz están trackeados api.err.log y api.out.log
(vacíos), cookies.txt (cookie jar de curl, vacío), in ({"message":"Falta el token de autenticacion."}), y
debug_reserva.js/debug_reserva2.js con IDs fijos (const userId = 99;, WHERE id=26), agregados en 0c5ce25
("error de resrevas"). En el FE está vite-dev.err (0 bytes).
Impacto: hoy no hay nada sensible, pero el próximo cookies.txt podría traer una sesión válida.
[MEDIO] Unas 52.000 líneas de skills de IA de terceros versionadas en ambos repos
Evidencia: el FE tiene 177 archivos en .agents/skills/ y 3 en .claude/skills/, unas 41.400 líneas, más que el
código propio del FE. Hay JS ejecutable y minificado (.agents/skills/impeccable/scripts/live-browser-
session.js, modern-screenshot.umd.js). El BE tiene 62 archivos (unas 10.500 líneas). Ambos tienen además
skills-lock.json, opencode.json y AGENTS.md. El commit que instaló impeccable se llama c301f9b "fix land".
Por último, eslint.config.js:8 solo ignora dist, así que npm run lint también recorre .agents/.
Impacto: ensucia las búsquedas, los diffs, las estadísticas y el linter, y mezcla material ajeno con la entrega.
[MEDIO] Dependencias declaradas sin ningún import (5)
Evidencia: en el BE, package.json:41 "routes": "^2.1.0" (paquete npm viejo, no relacionado con
express.Router). En el FE, dotenv (no tiene sentido en un bundle de Vite), ogl, html2canvas y react-icons (los
íconos salen de lucide-react).
Impacto: más superficie de ataque y señal de sugerencias aceptadas sin verificar.
[MEDIO] Código de prueba manual y herramientas sueltas dentro de src/ y scripts/ (acredita a auditor-
arquitectura-backend y a auditor-calidad-codigo)
Evidencia: src/appTest.js + services/testService.js + repositories/testRepository.js (insertan "Empresa
desde API" en la DB real). La colección Postman está en src/postman/. scripts/probe-request-route.cjs, verify-
request-insert.cjs, diagnose-deal-permissions.cjs y send-emails.cjs no están cableados en package.json.
check_nodemailer.cjs usa mailtrap, no nodemailer: el nombre quedó viejo después de 7f00c8c. Toda la raíz git
cuelga de SmartLot_API/ (git ls-files | grep -vc '^SmartLot_API/' → 0).
Impacto: el lector no sabe qué herramienta sigue vigente.
[BAJO] Assets pesados o muertos en el FE (acredita a frontend-arquitectura y a frontend-estandares)
Evidencia: src/Imagenes/FotoEmpleado1.jpg pesa 7,4 MB y tiene 0 imports. Tampoco se usan Logo_smartLot.png,
assets/react.svg, vite.svg, hero.png ni src/App.css (el template de Vite intacto). index.css:204-210 conserva
:where(.counter). public/GIF_IMGS_LOGO/ tiene 120 PNG (unos 11 MB) usados como frames de animación en
LogoWatermark.jsx:11. Funciona, pero es caro.
[BAJO] opencode.json expone el project_ref de Supabase de producción
Evidencia: "url": "https://mcp.supabase.com/mcp?project_ref=amhjswdgrbyfvjmogzjw" en BE y FE. No es una
credencial y el header de Render usa {env:RENDER_API_KEY} (bien hecho), pero deja configurado un acceso de agente
a la DB real para cualquiera que clone el repo. No amerita rotación.
[BAJO] Higiene de commits e identidad de autores (complementa B7)

Evidencia: en el BE, git shortlog -sne da 42 Android Studio <devandroid@ort>, 7 Franco-Cappella, 3
FrancoUrquizo, 3 Tubia1, 1 AUGUSTO AMADEO TRAVERSO (+1 unknown <augustraver@…>) y 1 Flor. En el FE, 29
Android Studio, 13 Franco-Cappella, 13 Tubia1 y 5 FrancoUrquizo. Hay mensajes a, asd, wasd, wasdwads, mini,
fix land ×3 y "morbo tha king" (7c50060). A favor: hay prefijos feat:/fix:/perf: y el commit de poda explícita
9b7d8cc.
Impacto: el 60 % del trabajo no se puede atribuir, y la nota individual no se puede dar sin aclararlo.
2.2 Arquitectura backend — 6/10
[ALTO] El dominio de pagos completo vive en el controller: SQL, transacciones y reglas (acredita a api-rest y a
calidad-codigo)
Evidencia: controllers/paymentController.js:10 import pool from '../database/db.js';. Dentro del controller
están savePaymentRecord (:21-133, SELECT + UPDATE + upsert), persistPaymentAndConfirmReservation (:135-
161, BEGIN / SELECT … FOR UPDATE / regla "aprobado + retención vigente + monto coincide → confirmar" / COMMIT),
el UPDATE reservas SET estado_reserva='expirada' dentro del handler /preference (:223-226, que duplica
reservaRepository.expirePendingAsync), el "sandbox cap" (:265-279) y el INSERT INTO reembolsos (:474-477).
En total son 14 queries. No existen PaymentService ni PagoRepository, y mpService.js solo envuelve el SDK.
Impacto: es el módulo más delicado del sistema y el único sin capas. No se puede reusar desde el job de expiración y
testearlo obliga a levantar Express.
[ALTO] Bug transaccional: savePaymentRecord recibe db pero escribe con pool (acredita a calidad-codigo, que lo
detectó en paralelo)
Evidencia: paymentController.js:21 async function savePaymentRecord(paymentData, idEmpresa = null, db =
pool). En :39 const prefRes = await pool.query( y en :59 const upd = await pool.query(; recién en :131
usa db.query(...). La función se invoca con client dentro de BEGIN/COMMIT en :144.
Impacto: el UPDATE de :59 corre fuera de la transacción abierta en :138, así que un ROLLBACK no lo deshace. Es un
refactor a medias: el parámetro db promete una atomicidad que no existe.
[ALTO] La regla de negocio central de reservas está en un repository y duplicada en el service
Evidencia: repositories/reservaRepository.js:25-92 quoteAndCreateWithClientAsync:
const tipoCupo = Number(counts.trato)<Number(trato.cantidad_cocheras)?'dentro_cupo':'extra';
const responsable = trato.modalidad_pago==='empresa_cubre_cupo'&&tipoCupo==='dentro_cupo'?'empresa':'empleado';
const importe=Number((tarifa*minutos/60).toFixed(2));
Además lanza errores con statusCode: 403/404/409 (:35-61) y decide el estado y la retención de 10 minutos (:64).
Al editar, reservaService.js:289-294 valida la disponibilidad con otra implementación en JS
(_validarRelacionesAsync en :669 y _validarDisponibilidadAsync en :763-875). updateWithLimitAsync
(:105-130) abre su propia transacción dentro del repo.
Impacto: la tarifa, el cupo y quién paga son la regla de SmartLot, y vive en la capa de datos con dos implementaciones
que van a divergir.
[ALTO] God services y God controller: reservaService.js (914 l., unos 33 métodos), usuarioService.js (716 l.) y
paymentController.js (535 l.)
Evidencia: reservaService mezcla consultas, ciclo de vida, acceso con QR, validaciones y un job periódico
(iniciarExpiracionAutomatica, :25). Tiene métodos sin uso: _validarCapacidadReservasActualGarage (:902) y
usuarioTieneReservasActivasAsync (:191). usuarioService importa pool, emailService, jwt y bcrypt (:2,9-
11), mezcla CRUD con login, refresh y recupero, y resuelve una dependencia circular con ReservaService mediante
import() dinámico (:32-39, // Lazy-loaded to avoid circular dependency with ReservaService).
Impacto: el ciclo Usuario ↔ Reserva es el síntoma, y el import dinámico lo tapa en lugar de resolverlo. Las tablas de
descomposición están en la sección 3.
[MEDIO] Services con SQL inline que se saltean su propio repository, duplicado entre services

Evidencia: _obtenerActorNombre y _obtenerDueniosGarage son idénticos en
solicitudEmpresaGarageService.js:17-50 y tratoEmpresaGarageService.js:26-55. SELECT id, id_empresa
FROM sedes WHERE id = $1 aparece 4 veces en solicitudEmpresaGarageService.js:161,189,299,328.
this.repo.pool.query(...) (:251) le saca el pool al repo. garageService.js:59-66,154-164 inserta en
trato_empresa_garage aunque existe su repo. emailService.js:312-313 repite la query de
repos/EmailTemplateRepository.js:25.
[MEDIO] Autorización por rol y tenant dentro de los repositories
Evidencia: empresaRepository.js:11-13 if (requestingUser && Number(requestingUser?.id_rol) !== 4) {
return []; }. Hay 91 referencias a requestingUser/id_rol en repositories/. ConflictoRepository.js:29
define su propio getTenantCondition, distinto del helper helpers/tenantFilter.js.
Impacto: un return [] silencioso en lugar de un 403. Filtrar por tenant en SQL está bien; decidir permisos en el repo,
no.
[MEDIO] AuthController se saltea el service y vuelve a implementar la emisión de JWT
Evidencia: AuthController.js:3-4,7 hace new UsuarioRepository(). signTokens y createSession (:39-83)
firman el access token dos veces (el primero se descarta en :63). El payload no incluye id_garage, a diferencia del
de usuarioService.js:86-89. En total hay 4 emisores de JWT (usuarioService ×3 en :91, :166, :501,
AuthController ×1) y ya divergieron.
[MEDIO] Convenciones paralelas: repos/ vs repositories/, dos pools y dos políticas de error (acredita a
repositorio y a calidad-codigo)
Evidencia: src/repos/ (EmailTemplateRepository, NotificacionRepository) convive con src/repositories/ (17
archivos), aunque el propio scripts/check-structure.cjs:36 espera repositories/. database/dbClient.js es un
pool idéntico a db.js (las mismas 36 líneas, cambia solo el export) y solo lo usa emailService.js:6. Resultado: dos
pools en producción. El comentario dbClient.js:2-3 lo justifica con que "mock.module de Node falla con módulos
que usan export default", pero test/garage-responsables.test.js:4 y otros 6 tests mockean db.js con
defaultExport sin problema. El comentario es falso.
Impacto: quien agrega una entidad no sabe qué convención seguir.
[MEDIO] Capa entities/ muerta y desactualizada (acredita a calidad-codigo y a base-datos)
Evidencia: 12 clases y 0 imports en src/ y test/. entities/Reserva.js declara 10 de las 22 columnas.
entities/Conflicto.js:10-11 declara DeleteBy y DeleteAt, que la tabla no tiene. check-structure.cjs:35 exige
que la carpeta exista.
[BAJO] Configuración dispersa, sin módulo config/ central
Evidencia: JWT_EXPIRES_IN se lee 11 veces, JWT_SECRET en 4 archivos y NODE_ENV 24 veces. Las opciones de cookie
están copiadas 8 o más veces en usuarioController.js:62-75, 95-108, 116-117, 136-146, 179-192, aunque
AuthController ya las centraliza en AUTH_COOKIE_OPTIONS (:18-28).
[BAJO] Infraestructura mezclada con las capas y Demeter
Evidencia: services/supabaseAdminClient.js es un cliente de infraestructura, no un service.
authMiddleware.js:2,26 hace pool.query directo. garageController.js:43 llama a
svc.sedeService.getByIdAsync(...), metiéndose en la composición interna de otro service.
geolocalizacionService.js:15,68 hace axios.get(url) sin timeout.
2.3 API REST — 6/10
Inventario: unos 136 endpoints en 17 routers (detalle completo en hallazgos/auditor-api-rest.md). La colección Postman
cubre unos 30 y está desactualizada. Endpoints que el FE no consume: GET /api/garage/:id/cercanos, POST
/api/garage/:id/ingreso-no-reserva y /egreso-no-reserva, POST /api/usuario/register, GET /api/auth/google y
POST /api/email-template/:codigo/test.

[ALTO] Los repositories se tragan los errores de DB y el controller los convierte en 404 o 500 a ciegas (acredita a
arquitectura-backend y a calidad-codigo, que contaron 71 copias)
Evidencia: repositories/empresaRepository.js:28 } catch (error) { console.error(error); return null; }
aparece unas 70 veces (garageRepository ×15, reservaRepository ×13, vehiculo ×7, usuario ×6…). Del lado del
controller, marcaController.js:48-49:
const data = await svc.updateAsync(parseInt(req.params.id, 10), req.body);
if (!data) throwError('No encontrado: La marca con ese ID no existe.', 404);
y en el alta (:37-38), if (!data) throwError('Error interno al crear la marca.', 500);. Los repos más
nuevos (cuentaCorriente, solicitudEmpresaGarage, tratoEmpresaGarage) propagan con throw: hay dos políticas
conviviendo.
Impacto: una caída de la DB responde "no existe" y una violación de constraint responde 500 en lugar de 400/409. El
diagnóstico se pierde y el FE muestra mensajes falsos.
[ALTO] PUT que valida como parcial pero ejecuta un UPDATE que reemplaza todas las columnas
Evidencia: sedeController.js:47-48 acepta campos opcionales y sedeRepository.js:45-46 ejecuta UPDATE sedes
SET id_empresa = $1, nombre = $2, descripcion = $3, ubicacion = $4, latitud = $5, longitud = $6 WHERE
id = $7. Pasa lo mismo en marcaRepository.js:36, rolRepository, modeloRepository y
empresaRepository.js:79-88. vehiculoRepository.js:63-67 y usuarioService.updateAsync sí lo resuelven bien.
Impacto: PUT /api/sede/5 {"nombre":"X"} deja id_empresa, la descripción y las coordenadas en NULL, y corrompe
datos sin avisar. PUT /api/marca/5 {} viola NOT NULL, el repo devuelve null y la API responde 404 sobre una
marca que existe.
[ALTO] "No encontrado" que sale como 500 y además cierra la sesión
Evidencia: services/NotificacionService.js:22 (y :32) hace throw new Error('Notificación no encontrada…')
sin statusCode, así que errorHandler.js:2 responde 500, y en :6-9 el 500 ejecuta
res.clearCookie('access_token') y res.clearCookie('refresh_session_id'). Además,
NotificacionController.js:24 hace Number(id) sin validar.
Impacto: marcar como leída una notificación inexistente desloguea al usuario. Cualquier 500 (incluido un error de
CORS en app.js:68) invalida la sesión: es una decisión de seguridad tomada en el lugar equivocado.
[MEDIO] authMiddleware responde 401 cuando falla la base
Evidencia: en authMiddleware.js:24-56, el mismo try envuelve jwt.verify y pool.query, y el catch siempre
responde 401 'Token invalido o expirado.' y limpia cookies. Si se cae la DB, todos los usuarios ven "token
inválido".
[MEDIO] paymentController no sigue ninguna convención del resto de la API
Evidencia: usa try/catch + next manual (:203, :325), mensajes en inglés (:258 'Items array is required', :221
'idReserva is required' para un id inválido), otro formato de error (:427 res.status(400).json({ error:
'Invalid signature' })), un 404 armado a mano dos veces (:408-416, :528-530), respuestas en camelCase y una
variable sin usar (:445). errorHandler.js:12-14 loguea todos los 404 con el prefijo [MP].
[MEDIO] GET con efectos secundarios en pagos
Evidencia: paymentController.js:388-390 hace getPayment y después savePaymentRecord(payment,
req.usuario?.id_empresa). GET /api/payments (:514-519) hace upsert de cada resultado.
Impacto: un GET escribe con el id_empresa de quien consulta, así que cualquiera puede "adoptar" un pago para su
empresa con solo leerlo (ver Seguridad).
[MEDIO] Validación de :id inconsistente, incluso dentro del mismo controller (acredita a calidad-codigo, que contó
4 variantes)

Evidencia: marcaController.js:24-25 (GET) parseInt + isNaN frente a :44 (PUT) isValidId. En total hay
parseInt+isNaN ×34, parseInt(…,10) ×10, Number() ×3, isValidId ×11 y un parseId() local. GET
/api/marca/7abc devuelve la marca 7.
[MEDIO] Validación duplicada y contradictoria entre capas (PUT reserva)
Evidencia: reservaController.js:117-118 valida id_usuario, pero reservaService.js:242-243 lo descarta con
una whitelist y además en :245-247 lo borra otra vez.
[MEDIO] Un mismo endpoint devuelve dos entidades distintas según el rol
Evidencia: tratoEmpresaGarageController.js:58-68 crea un trato si sos superadmin y una solicitud (con tipo:
'solicitud') en cualquier otro caso, aunque ya existe POST /api/solicitud-empresa-garage.
[BAJO] Status codes puntuales mal elegidos
garageController.js:296 usa 400 para "ya existe o no existe" (409/404). reservaController.js:158 tiene un 500
en una rama muerta. paymentController.js:237 agrupa tres causas bajo un 403. empresaController.js:18 hace
if (!data) … 500 sobre listas.
[BAJO] authMiddleware aplicado dos veces por request
Evidencia: app.js:82 y además reservaController.js:97, 113, 131, 141, 153, 169, 184. Pasa lo mismo con
app.js:92 y las 5 rutas de NotificacionController.js. Son dos jwt.verify y dos queries por request, en un
endpoint que el FE consulta cada 30 s.
[BAJO] Naming de rutas heterogéneo
Evidencia: singular y plural (/api/empresa vs /api/cuentas-corrientes), inglés y castellano (/api/payments,
/:id/cancel vs /:id/cancelar), snake y kebab (/ocupacion_reserva/:id vs /distancia-sede), y una ruta no
ASCII con 3 alias: usuarioController.js:497 ['/:id/contraseña', '/:id/contrasenia',
'/:id/contrase%C3%B1a'].
[BAJO] Endpoints duplicados u huérfanos, contratos de usuario con 3 formas, errores de MP reenviados tal cual
garageController.js:108 (/:id/cercanos, donde :id es una sede) duplica /cercanos y no pasa req.usuario
(:112). tratoEmpresaGarageController.js:81-86 tiene un DELETE "alias histórico". GET /me
(usuarioController.js:269) devuelve los claims del JWT, mientras login devuelve la fila de DB.
usuarioController.js:25 expone limite_reservas_activas y limiteReservasActivas a la vez.
mpService.js:116-118 propaga el status del SDK, así que un 401 de MP llega al FE como sesión expirada.
[SUGERENCIA] Números mágicos de status (no se usa http-status-codes) y colección Postman desactualizada como único
contrato publicado.
2.4 Seguridad — 5/10
Matriz de rutas completa en hallazgos/auditor-seguridad.md. Salvo /api/usuario, /api/solicitud-registro,
/api/auth y /api/payments/webhook, todos los routers montan authMiddleware a nivel app. No hay endpoints de debug
montados.
[CRITICO] Cualquier usuario autenticado puede reembolsar cualquier pago (acredita a api-rest)
Evidencia: /api/payments está montado solo detrás de authMiddleware, sin rol (app.js:98-102, verificado por el
orquestador). controllers/paymentController.js:461-470:
router.post('/:paymentId/refund', async (req, res, next) => {
const { paymentId } = req.params; const { amount, motivo } = req.body;
...
const refund = await refundPayment(paymentId, amount);

No hay chequeo de rol ni de que el pago pertenezca al usuario o a su empresa. Para tener sesión alcanza con POST
/api/usuario/register, que es público (usuarioController.js:296).
Impacto: un usuario autorregistrado puede reembolsar pagos de cualquier empresa. Un empleado puede pagar su
reserva y reembolsarse a sí mismo, y la reserva queda confirmada porque el refund solo actualiza pagos (:489). Hoy
lo mitiga que corren en sandbox, pero es una falla de diseño.
[ALTO] Listado global de pagos y de eventos de webhook para cualquier usuario logueado
Evidencia: paymentController.js:501-510: GET / llama a searchPayments(filters) con filtros que arma el cliente,
sin restricción de empresa. :330-353: GET /webhook-events devuelve el payload completo de hasta 500 eventos,
sin rol.
Impacto: fuga de montos, referencias y datos de pagadores entre empresas.
[ALTO] El monto de los pagos de admin y los consumos saldados los decide el cliente (entrada unificada: seguridad
+ frontend-estandares; acredita a base-datos por el regex)
Evidencia:
FE vistasAdmin/admin_pagos.jsx:206-213:
const aCobrar = montoTest(cuenta.importeGenerado);
const orderId = `ADMIN-PAGO-${cuenta.periodo}-G${cuenta.idGarage}-S${cuenta.idSede}-${Date.now()}`;
const consumosIds = cuenta.movimientos.map((m) => m.idConsumo);
BE paymentController.js:265-274:
const esPagoAdmin = String(orderId).startsWith('ADMIN-PAGO-');
const sandboxMode = !reserva && (isSandbox() || esPagoAdmin);
if (sandboxMode) { const MAX_TEST = 0.10; ... }
:291 guarda consumos_ids y :306 persiste el monto sumando unit_price, todo tal como viene del body.
No hay requireRole.
cuentaCorrienteService.js:59-76 marca como PAGADO todo consumo listado en metadata.consumos_ids
o cuyo id_orden_externa matchee /ADMIN-PAGO-(\d{4}-\d{2})-G(\d+)-S(\d+)/.
Impacto: con un pago aprobado de $0,10 se salda la deuda de un período entero, aunque la app esté en
producción, porque el "modo test" lo activa un prefijo que controla el usuario. El servidor nunca recalcula lo
adeudado. Contrasta con el flujo del empleado, donde el BE sí recalcula desde importe_estimado
(paymentController.js:248-252).
[ALTO] Escrituras sin aislamiento por empresa
Evidencia:
Sedes: sedeController.js:33-62 (requireRole(1, 4)) llama a svc.updateAsync(id, req.body) y
deleteAsync(id) sin req.usuario, y sedeRepository.js:42-56 hace UPDATE … WHERE id = $7 sin filtro de
empresa. Un admin crea sedes en otra empresa (toma id_empresa del body), las edita, las reasigna o las borra.
Usuarios: usuarioService.js:375-393 (updateEstadoAsync) y :588-599 (deleteAsync) no llaman a
_aplicarReglasDeActualizacion, que sí aplica el tenant en updateAsync. Un admin puede dar de baja a
usuarios de otra empresa, superadmin incluido.
Reservas: reservaService.js:301-315 (cancelarAsync) y :367-380 (liberarRetencionAsync) usan
getByIdAsync(id) sin requestingUser. updateAsync (:249) sí filtra.
Garages (MEDIO dentro del punto): garageController.js:318-335 (ingreso-no-reserva/egreso-no-
reserva) no llama a assertGarageControl, a diferencia del PUT y el DELETE del mismo archivo.
Impacto: el modelo multi-tenant se rompe en las escrituras. Un admin podría dejar la plataforma sin superadmin.
[MEDIO] Logout que revoca sesiones de cualquiera usando un JWT sin verificar
Evidencia: usuarioController.js:123-129, en un endpoint público, hace const decoded =
jwt.decode(accessToken); if (decoded?.id) { svc.revocarRefreshTokensAsync(decoded.id) … }.

Impacto: con un token falso {"id": <víctima>} se fuerza el cierre de sesión de cualquier usuario, de forma repetible
(DoS dirigido contra el superadmin).
[MEDIO] Código de recupero de 6 dígitos sin límite de intentos y con login directo
Evidencia: usuarioService.js:434 usa Math.floor(100000 + Math.random() * 900000). :471-487 no cuenta
intentos ni invalida el código. El código vive 10 min. Lo único que frena es el rate limiter global de 100 req / 3 min por
IP (rateLimiterMiddleware.js:3-5). /login-con-codigo (usuarioController.js:167) entrega una sesión
completa.
[BAJO] El registro público de empresa devuelve el hash de la contraseña
Evidencia: solicitudRegistroService.js:59-71 devuelve el RETURNING * (que incluye contraseña_hash) sin
_sanitizarSolicitud, cuando los otros métodos del service sí lo aplican (:25).
[BAJO] Webhook fail-open si falta MP_WEBHOOK_SECRET
Evidencia: mpService.js:122-128 hace if (!secret) { console.warn('... (DEV MODE)'); return true; }. Lo
mitiga que el handler vuelve a consultar el pago a MP (paymentController.js:435).
[BAJO] Login con Google vincula por email sin verificar el proveedor
Evidencia: AuthController.js:105-128 no controla app_metadata.provider ni email_confirmed_at. Depende de la
configuración de Supabase.
[BAJO] Enumeración de cuentas y HTML sin escapar en las plantillas de respaldo
Evidencia: usuarioService.js:264 y solicitudRegistroService.js:56 responden "Ya existe un usuario con el email
X". usuarioService.js:62-66 informa "Cuenta desactivada" antes de verificar la contraseña. emailService.js:229-
240 interpola solicitante y empresa_nombre sin escaparHtml, mientras las plantillas de DB sí escapan (:330-336).
[SUGERENCIA] Cambio de contraseña sin pedir la actual (usuarioController.js:497-510). TLS a la DB con
rejectUnauthorized: false por defecto (database/db.js:17), aunque existe la vía estricta con CA.
2.5 Arquitectura frontend — 6/10
Mapa: api/client.js (axios + refresh con cola + invalidación), cache/cacheStore.js, servicies/ (18 API_*.js), Context
(AuthProvider, GoogleMapsProvider), hooks/ (5) y helpers/ (28, con 12 tests). La UI se organiza por rol: vistasX +
componentesX. App.jsx tiene 53 rutas lazy.
[ALTO] El retorno de Mercado Pago desde admin_pagos apunta a una ruta que no existe
Evidencia: vistasAdmin/admin_pagos.jsx:214-217 arma success/failure/pending:
\${window.location.origin}/admin/pagos`, pero la ruta registrada es /admin_pagos (App.jsx:204) y
/admin/pagos cae en el catch-all ( ). mpService.js:45haceback_urls: { ...defaultBackUrls, ...backUrls }, así que
gana el valor del front. admin_pagos.jsx:152-154esperapayment_id/external_reference` que nunca llegan.
Impacto: después de pagar, el admin termina en la landing y la verificación automática no corre. La causa de fondo es
que hay 111 navigate("/…") literales y solo los "home" están centralizados.
[ALTO] La capa de servicios no fija el contrato con el backend y las vistas adivinan la forma de los datos (entrada
unificada: frontend-arquitectura + calidad-codigo "funciones adivinadoras" + frontend-componentes; la duplicación en sí
está en Calidad)
Evidencia:
obtenerListado (con ese nombre, 12 copias; 21 contando normalizadores equivalentes), por ejemplo
componentesAdmin/tabla_reservas_panelControl.jsx:13-20:

if (Array.isArray(datos?.datos)) return datos.datos;
if (Array.isArray(datos?.data)) return datos.data;
if (Array.isArray(datos?.reservas)) return datos.reservas;
if (Array.isArray(datos?.value)) return datos.value;
Ya existe un normalizeList equivalente en helpers/tratos.js:29, que usan solo 7 archivos.
obtenerIdUsuario tiene 10 definiciones con distinto orden de precedencia. empleados_dashboard.jsx:41-50
prueba unas 10 rutas, incluida usuario?._id. admin_panel_de_control.jsx:45 cae en item?.id, que en una
reserva es el id de la reserva.
empleados_dashboard.jsx:53: obtenerIdGarage = item?.id_garage ?? item?.idGarage ??
item?.garage_id ?? item?.garageId ?? item?.garage?.id_garage ?? item?.garage?.id ?? item?.id.
En src/ hay 34 usos de ._id (la convención de MongoDB) en un proyecto con Postgres.
Impacto: un cambio de contrato rompe 20 pantallas en silencio, y los fallbacks del tipo ?? item.id devuelven datos
equivocados sin dar error.
[MEDIO] Unos 10 componentes se saltean la capa de servicios
Evidencia: hay llamadas a apiClient inline en components/UserDropdown.jsx:123,145, perfil_admin.jsx:50,61,
perfil_empleado.jsx:258,263,320,331, perfil_dueño_garage.jsx:209,214,271,282, LoginForm.jsx:70,104,
RegisterEmpresaForm.jsx:120, RegisterGarageForm.jsx:109 y ForgotPassword.jsx:46,78,111. Mientras tanto,
API_Usuario.js exporta UsuariosUpdate (:161), UsuariosLogin (:235) y UsuariosStopImpersonate (:281), que
nadie usa. El flujo de stop-impersonate está copiado 4 veces y sin try/catch.
[MEDIO] Invalidación de caché duplicada, contra lo que afirma el ADR-004
Evidencia: el ADR-004 dice "El mapeo mutación → prefijos invalidados vive centralizado en el interceptor de
client.js". Sin embargo, el interceptor (api/client.js:70-169) y además 53 llamadas a invalidateByPrefix en
15 API_*.js (por ejemplo API_Reserva.js:12-18) invalidan. /api/solicitud-*, /api/payments y /api/cuentas-
corrientes solo se invalidan en el servicio. El test API_Reserva.source.test.js exige la duplicación.
[MEDIO] El usuario logueado tiene tres fuentes de verdad
Evidencia: (1) AuthContext.usuario sale de /me, que devuelve el payload del JWT (usuarioController.js:268-270).
(2) Por eso 6 vistas vuelven a pedir el perfil y lo guardan en estado local (empleados_dashboard.jsx:298, 343, 547).
(3) En impersonación, AuthProvider.jsx:28-30 prefiere la copia en una cookie escribible por JS
(helpers/superadminSession.js:43-54, constante LS_IMPERSONATED) por sobre el servidor, con max-age de 86400.
[MEDIO] Login con tres estrategias distintas para actualizar la sesión
Evidencia: LoginForm.jsx:84 y ForgotPassword.jsx:84 hacen window.location.href = … (recarga completa),
mientras AuthCallback.jsx y la impersonación usan setUsuario + navigate.
[MEDIO] Cadenas de useEffect que sincronizan estado en vez de derivarlo
Evidencia: gestion_usuarios.jsx:235-239 resetea filtros en un efecto por selectedRol, y en :401-417 hay tres
efectos más sobre memos que dependen de los propios filtros. empleados_dashboard.jsx:314-315 guarda la misma
reserva cruda y normalizada.
[MEDIO] Vistas-contenedor sin layout routes (la descomposición está en Componentes)
Evidencia: no hay ningún uso de <Outlet>. Cada vista importa a mano su header_<rol>/footer_<rol>. Agregar
una pantalla implica repetir el header, el footer, la carga del perfil y los normalizadores.
[BAJO] Roles por número y por nombre en el router (allowedRoles={[4]} ×16 frente a ["dueño_garage"] ×6),
reconocido como deuda en ADR-003. localStorage.getItem("smartlot_empleado_config") se lee en
header_empleado.jsx:9 y form_reserva.jsx:49 pero nadie la escribe: la poda quedó a medias. Hay tres carpetas de
"compartidos" y dos de "páginas" (ver Estándares).

[SUGERENCIA] El ADR-006 promete cargar SweetAlert2 de forma dinámica, pero 20 archivos lo importan estático, incluido
UserDropdown.jsx, que está en los 4 headers. Además hay dos showToast paralelos (api/client.js:16 y
helpers/toast.js:4).
2.6 Componentes y reutilización — 5/10
Inventario y familias completos en hallazgos/auditor-frontend-componentes.md. Resumen de familias clonadas: footer por
rol (4, ~95 %), botón de footer (3, 100 %), header por rol (4, ~85 %), tarjeta de dashboard (2, ~95 %), tabla de conflictos +
papelera (admin/superadmin, ~85 %), modal de archivados (2, ~85 %), modal de reporte/soporte (2, ~90 %),
consumos/cuentas (admin_pagos / cuentas_por_cobrar, ~70 %), alta de sede (admin/superadmin, ~85 %), formulario de
datos personales (~75 %), alta y edición de garage (campos ~80 %, código 0 % compartido), tarjeta de acceso del garagista
(2 inline, ~85 %), skeletons (11 variantes) y formularios de registro de la landing (~75 %).
[ALTO] God components: 6 vistas de 850 a 1.355 líneas con 20-35 useState (acredita a calidad-codigo y a frontend-
arquitectura)
Evidencia: vistasSuperadmin/gestion_usuarios.jsx tiene 1.355 líneas, 21 useState, 8 useEffect y 3 modales.
garagista_dashboard.jsx tiene 1.260 líneas y unas 300 de helpers de fecha antes del componente.
admin_reportes_analisis.jsx tiene 1.170 líneas, con interpolación Catmull-Rom a mano en :432.
superadmin_pagos_test.jsx tiene 1.074 líneas y 35 useState (CrearPagoTab va de :120 a :672).
admin_panel_de_control.jsx tiene 883 líneas y 20 useState. empleados_dashboard.jsx tiene 861 líneas y 26
useState.
Impacto: nadie puede comparar dos archivos de 800 líneas a ojo, y de ahí salen los bugs de divergencia que siguen.
Las tablas de descomposición están en la sección 3.
[ALTO] La copia editar_zona divergió de agregar_zona y manda al superadmin a pantallas de admin
Evidencia: App.jsx:189-191 protege /editar_zona con allowedRoles={[4]}, pero
vistasAdmin/editar_zona.jsx:4 importa header_admin (el logo lleva a /admin_dashboard) y en :277, :331,
:376 hace navigate("/gestion_garages"), una ruta de allowedRoles={[1]}. Su hermana agregar_zona.jsx:4
usa header_superadmin y vuelve a /superadmin/gestion_garages (:172, :185). Además, editar_zona.jsx:414-
690 reimplementa inline lo que el alta resuelve con FormularioZona + FormularioCapacidad
(agregar_zona.jsx:225-236).
Impacto: guardar o cancelar la edición deja al superadmin en /unauthorized. Es la evidencia más clara de "alta y
edición como dos copias".
[ALTO] Tabla de conflictos clonada entre admin y superadmin, con mejoras aplicadas a una sola copia
Evidencia: admin_panel_de_control.jsx:53-130 y superadmin_conflictos.jsx:19-100 comparten
formatearFecha, prioridadClase, estadoClase y ConflictsTableSkeleton literales.
superadmin_conflictos.jsx:5 importa el CSS de admin. ToastUndo se extrajo y se usa en superadmin (:572), pero
admin sigue con el toast inline (:812-814). Admin marca las filas urgentes y superadmin no.
[MEDIO] Header y footer copiados por rol: 4 + 4 componentes, 3 botones idénticos y 4 CSS casi iguales
Evidencia: footer_admin.jsx:44-90, footer_superadmin.jsx:38-87 y footer_empleado.jsx:38-84 son la misma
función y solo cambian FOOTER_ITEMS/FOOTER_STORAGE_KEY. footer_admin.css y footer_empleado.css tienen 264
líneas cada uno y solo cambia el prefijo. footer_empleado.css:42 deja .footer-active-indicator sin scope.
header_superadmin.jsx:22-24 y header_empleado.jsx:34-36 dibujan una campana SVG sin funcionalidad.
[MEDIO] buildConditions copiado en 15 archivos, en dos versiones
Evidencia: agregar_sede.jsx:73-77 no soporta reglas-función y form_reserva.jsx:118 sí.
hooks/useLiveValidation.js:6-41 ya evalúa cada regla, pero no devuelve el formato que necesita
FieldValidation.
[MEDIO] Alta de sede admin vs superadmin: un campo "opcional" que es obligatorio en una sola copia

Evidencia: vistasSuperadmin/agregar_sede.jsx:177-183 tiene <textarea placeholder="Descripción de la sede
(opcional)" … required />, y en vistasAdmin/agregar_sede.jsx:167-173 no lleva required. El bloque
Autocomplete está duplicado incluso dentro de cada archivo y handlePlaceChanged aparece en 4 archivos.
[MEDIO] Existe ModalPortal pero 7 modales lo esquivan y otros duplican lo que ya hace
Evidencia: overlays a mano en admin_panel_de_control.jsx:822, empleados_dashboard.jsx:786,
admin_pagos.jsx:37, :56, cuentas_por_cobrar.jsx:19, :30, gestion_garages.jsx:268 y
superadmin_pagos_test.jsx:701. gestion_usuarios.jsx:342-360 y :755-770 agregan Escape y overflow sobre
un ModalPortal que ya lo hace (ModalPortal.jsx:10-23).
[MEDIO] admin_pagos vs cuentas_por_cobrar: clon con JSX "minificado"
Evidencia: los dos definen moneda, fechaHora, nombrePeriodo y duracion. Hay líneas de 1.939 caracteres
(cuentas_por_cobrar.jsx:50), 1.262 (admin_pagos.jsx:277), 1.866 (gestion_empresas.jsx:127) y 1.495
(gestion_garages.jsx:239), y 12 useState declarados en 3 líneas (cuentas_por_cobrar.jsx:35-37).
[MEDIO] Modales de "archivados" y "reportar problema" clonados, con UX ya divergente
Evidencia: gestion_usuarios.jsx:1144-1244 vs gestion_de_empleados.jsx:685-~790.
MAX_PALABRAS/contarPalabras están copiados en empleados_dashboard.jsx:27-28 y
admin_panel_de_control.jsx:33-34. El empleado ve una confirmación (:681-686) y el admin no (:469-472).
[MEDIO] garagista_dashboard: tarjeta de acceso duplicada inline y un empty state que miente
Evidencia: :950-991 y :1015-1062 repiten la misma tarjeta. El EmptyState de pendientes (:993-997) dice "No hay
reservas próximas" aunque esté filtrando por búsqueda; la copia de "dentro" (:1066-1074) sí contempla el filtro.
[MEDIO] Skeletons: 11 variantes del mismo primitivo en 24 archivos
Evidencia: skeleton-line ×34, garagista-skeleton-line ×24, empleado-skeleton-line ×16… Ya existe Linea({
width, height }) en componentesDueñoGarage/skeleton_admin_garage.jsx:3 y nadie más lo usa.
[BAJO] Componentes compartidos que viven en carpetas de rol (BotonGenerico en componentesAdmin/, usado por 4
roles). Props muertas o engañosas: <GestionTratosGarage usuario={usuario} mode="owner" /> cuando el componente
no recibe props; roles/fixedRoles/hideSede sin uso; ultimoReporte recibe el piso; import FooterEmpleado from
'../componentesAdmin/footer_admin'; dos FormularioInfoPersonal distintos. Carga simulada de 600 ms en
admin_dashboard.jsx:41-44 sobre 6 botones estáticos. key={i} en una lista editable
(superadmin_email_templates.jsx:522-523).
[SUGERENCIA] La pantalla de testing de pagos (superadmin_pagos_test.jsx, con TARJETAS_PRUEBA hardcodeadas) está
ruteada en producción con acceso desde el dashboard.
2.7 Estándares, estilos y lógica en el frontend — 5/10
Estrategia de estilos: 63 .css globales (0 CSS Modules) importados desde 76 .jsx, Tailwind v4 con tokens @theme (297
usos de *-brand-* en 33 .jsx, casi todos de la landing), 259 style={{}} en 49 archivos (94 solo en PaymentStatus.jsx)
y colores en JS (Swal, Maps, SVG) en 40 archivos. Escenario (b): los tokens existen pero conviven con miles de hex
sueltos.
Test del color
Comando base: grep -rhoiE "#<HEX>\b" src --include=*.css --include=*.jsx --include=*.js | wc -l (ocurrencias)
y grep -rliE … (archivos).

Color Rol según Ocurrencias Archivos ¿Está tokenizado?
DESIGN.md
#2563EB brand-blue (marca) 247 64 (16 son Sí (--color-brand-blue, --accent), pero
.jsx/.js) solo lo consume la landing
rgba(37,99,235,…) marca con alpha 112 41 No
Marca total (#2563EB + 359 65 —
rgba)
#1D4ED8 hover/pressed "de 75 26 No (DESIGN declara otro valor)
facto" (DESIGN dice
#1A73E8)
#156FE5 brand-accent-hover 48 14 Sí, pero hardcodeado en 14 archivos
#3B82F6 no está en DESIGN 33 — No (y formulario_PerfilPersonal.css:11
lo usa como acento principal)
#64748B gris texto 258 60 No (DESIGN usa #475569 como muted)
#E2E8F0 border 228 47 Sí (--border), con 6 usos de var(--border)
contra 228 hex
Error: #EF4444 / #DC2626 error / error-strong 37 / 48 / 36 / 23 / 26 / 22 / No: ADR-005 dice que existe --error y no existe
/ #B91C1C / #E11D48 — —
Éxito: #22C55E / #16A34A success 5 / 17 / 15 / 5 / 12 / 9 / 6 No: el valor oficial (#22C55E) es el menos usado
/ #10B981 / #059669 12 de los cuatro
Superadmin #0F1A2E / paleta propia (ADR- 83 / 25 15 / 11 No (excepción documentada)
#1A2744 007)
El mismo azul redefinido como variable 6 veces, con 6 nombres:
src/index.css:13 --color-brand-blue: #2563EB;
src/index.css:63 --accent: #2563EB;
src/vistasAdmin/gestion_garages.css:2 --garage-primary: #2563eb;
src/vistasDueñoGarage/duenio_garage.css:5 --duenio-blue: #2563eb;
src/vistasDueñoGarage/cuentas_por_cobrar.css:1 --cxc-blue:#2563eb
src/componentesEmpleado/formulario_PerfilPersonal.css:12 --sl-accent-blue-hover: #2563eb; (acá la marca
pasa a ser el hover y #3b82f6 el principal)
Token y hex en el mismo archivo: duenio_garage.css:5 define --duenio-blue: #2563eb y en las líneas 81, 96, 141,
173, 235, 244 y 335 escribe #2563eb literal. Pasa lo mismo en gestion_garages.css:2 contra :221.
Consumo real de los tokens globales en CSS: grep -rlE "var\(--(color-brand|accent|text|text-
h|bg|border|shadow)\b" src --include=*.css → solo index.css, App.css (plantilla, ni siquiera se importa) y
landing.css. Ningún CSS de panel consume un token global.
SweetAlert, confirmButtonColor: la acción primaria usa #2563EB ×6 y #3b82f6 ×5. La destructiva usa #EF4444 ×9,
#e11d48 ×3 y #dc2626 ×2. Son 14 archivos y cada uno elige su rojo.
Verificación de los ADR:
ADR-005: "Colores --color-brand-* … y semánticos (--success, --warning, --error)". Falso: grep -rnE -- "--
(success|warning|error)\s*:" src no encuentra ninguna definición.
ADR-005 / DESIGN.md:157: "Ningún componente define sus propios colores". Falso: hay 2.330 hex fuera del
superadmin y 35 custom properties locales.
ADR-007: los compartidos "siguen el sistema general (tokens AA)". Falso: EmptyState.css tiene 22 hex y 0 var(;
campana_notificaciones.css, 42/0; ToastUndo.css, 11/0; tarjeta_garages.css, 24/0.
ADR-007, la excepción del superadmin, es cierta y está documentada (766 hex).

Tokens duplicados en index.css: --color-brand-deep = --color-brand-navy = #0C1E3F, --color-brand-bg = -
-color-brand-cream = #F5F7FB, y las fuentes están declaradas dos veces.
Conclusión: cambiar hoy el color de marca implica tocar 65 archivos (359 ocurrencias), o 79 si se cuenta la familia
de hovers y variantes. Cambiar el token --color-brand-blue solo repinta la landing.

Mapa de validaciones FE ↔ BE
| Regla | Formulario/pantalla (FE) | Contraparte en BE | Estado |
| ----- | ------------------------ | ----------------- | ------ |
Contraseña: ≥8, 2 RegisterEmpresaForm.jsx:65-74, isValidStrongPassword en OK
mayúsculas, 2 números, RegisterGarageForm.jsx:65-74 solicitudRegistroService.js:51
| 2 especiales |     | y usuarioController.js:336 |     |
| ------------ | --- | -------------------------- | --- |
Contraseña: ≥8, 2 agregar_empleado.jsx:100-106, usuarioController.js:389 usa DIVERGE
mayúsculas, 2 números, agregar_usuario.jsx:154-160, isValidPassword = /(?=.*[a-z]) (falla para los
2 especiales agregar_admin_sede.jsx:72-77 (POST (?=.*[A-Z])(?=.*\d).{8,}/ dos lados:
|     | /usuarios) |     | AB12!!XY |
| --- | ---------- | --- | -------- |
pasa en el FE
y el BE lo
rechaza
porque no
tiene
minúscula;
Abcdefg1
entra por la
API sin la
política
fuerte)
Contraseña al editar perfil_empleado.jsx:41-46, usuarioController.js:489 / :503 DIVERGE
| perfil | perfil_dueño_garage.jsx:45-50 | usan isValidPassword |     |
| ------ | ----------------------------- | -------------------- | --- |
Email formato 5 formularios, misma regex validatorHelper.js:17, misma OK
|     | /^[^\s@]+@[^\s@]+\.[^\s@]+$/ | regex |     |
| --- | ---------------------------- | ----- | --- |
Email único ningún formulario (correcto) solicitudRegistroService.js → OK (vive
|     |     | 409 | donde |
| --- | --- | --- | ----- |
corresponde)
Teléfono RegisterEmpresaForm/RegisterGarageForm: isValidPhone /^\d{7,15}$/ OK
/^\d{7,15}$/
Teléfono agregar_empleado.jsx:107-110, usuarioController.js:437 DIVERGE
agregar_usuario.jsx:161-164, isValidPhone = solo dígitos 7-15 (+54 11
|     | agregar_admin_sede.jsx:78-81: acepta +, |     | 4444-5555 |
| --- | --------------------------------------- | --- | --------- |
espacios, guiones y paréntesis, ≥7 dígitos, y envía pasa en el FE
|     | telefono.trim() sin limpiar |     | y da 400 en |
| --- | --------------------------- | --- | ----------- |
|     | (agregar_empleado.jsx:177)  |     | el BE)      |
Teléfono en perfil perfil_empleado.jsx:38: ≥7 dígitos, limpia isValidPhone (máx. 15) DIVERGE
|     | con replace(/\D/g,"") (:244) antes de enviar |     | leve (no hay |
| --- | -------------------------------------------- | --- | ------------ |
tope de 15
en el FE)
Patente agregar_vehiculo.jsx:23, isValidPatente: ABC123 o DIVERGE
agregar_empleado.jsx:112: /^[a-zA-Z0-9] AB123CD (validatorHelper.js:67- (1234567
|     | {6,8}$/ | 71) | pasa en el FE |
| --- | ------- | --- | ------------- |
y el BE lo
rechaza)
Nombre/apellido "solo 5 formularios isValidString (solo no vacío) SOLO FE
| letras", mínimo 2 |     |     | (riesgo bajo: |
| ----------------- | --- | --- | ------------- |
es formato)
Descripción de empresa RegisterEmpresaForm.jsx:83 solicitudRegistroService.js:43 OK
≤ 1000
Descripción de empresa agregar_empresa.jsx:17 empresaController.js:42: solo SOLO FE
| ≤ 500 |     | isValidString(nombre), sin tope |     |
| ----- | --- | ------------------------------- | --- |

Regla Formulario/pantalla (FE) Contraparte en BE Estado
Nombre de garage ≥ 3 agregar_zona.jsx:61, garageController.js:154: solo no SOLO FE
crear_garage_dueño.jsx:87, vacío (bajo)
editar_zona.jsx:189
Horario apertura < cierre 4 formularios de garage garageController.js:159 y :190 OK
Al menos un día 4 formularios de garage garageController.js:160 OK
operativo
capacidad_reservas agregar_zona.jsx:81 y /propio: 1..32767 DIVERGE
crear_garage_dueño.jsx:107: entero ≥0. (garageService.js:106). POST '': (dos criterios
agregar_garage_propio.jsx:129: entero sin validación de rango, solo ≤ en el FE y
1..32767 capacidad dos en el BE
(garageService.js:279) según el
endpoint)
Capacidad total = calculada en el FE (agregar_zona.jsx:139, Solo /propio la calcula en el servidor SOLO FE
reservas + no reservas crear_garage_dueño.jsx:166, (garageService.js:120). POST/PUT (ALTO)
editar_zona.jsx:157) '' guardan lo que llega
Precios ≥ 0 helpers/prices.js:1-6 validatePrices OK
(garageController.js:164)
Reserva: hora fin > inicio form_reserva.jsx:85, reservaService.js:735 (además: OK (el BE es
modal_editar_reserva.jsx:32 no en el pasado :730, duración más estricto,
mín./máx. :742-749) que es lo
correcto)
Límite de reservas helpers/reservationPolicy.js:1-7 helpers/reservationPolicy.js:9- OK
activas 0..32767 o null 14 + enforceReservationLimit en (fortaleza)
reservaRepository.js:40 (409)
Importe de la reserva del nueva_reserva.jsx:400, lo toma de paymentController.js:248-252 OK
empleado quote.importe recalcula desde (fortaleza)
reserva.importe_estimado
Importe y consumos de admin_pagos.jsx:206-232 arma unit_price, paymentController.js:257-306 SOLO FE
un pago de admin orderId y consumosIds persiste monto y consumos_ids tal (ALTO,
como llegan desarrollado
en
Seguridad)
Saldo: 9 OK · 5 DIVERGE · 5 SOLO FE (2 de los SOLO FE tienen consecuencia persistida: la capacidad total y los pagos de
admin).
[ALTO] Monto y consumos "PAGADA" decididos por el cliente en los pagos de admin. Está desarrollado como
entrada unificada en 2.4 Seguridad. Se cuenta acá porque es lógica de negocio con consecuencia persistida que vive en el
FE.
[ALTO] Capacidad total del garage calculada en el FE y guardada sin recalcular
Evidencia: vistasAdmin/agregar_zona.jsx:137-139 const cap = capRes + capNoRes; va al payload como
capacidad: cap (:159). Lo mismo en crear_garage_dueño.jsx:166 y editar_zona.jsx:157, :356. En el BE, POST
'' (garageController.js:153-169) persiste capacidad tal cual y solo verifica ≤ capacidad
(garageService.js:279-290), mientras que /propio sí la calcula (garageService.js:120).
Impacto: la API acepta capacidad=100, reservas=10, no_reservas=5. El equipo ya conocía la solución (en /propio)
y no la generalizó.
[MEDIO] Política de contraseñas divergente FE↔BE, con comentario del BE que lo niega

Evidencia: el FE exige la política fuerte en 7 formularios (grep -rl "Mínimo 2 mayúsculas" src → 7). El BE la aplica
solo en el registro público, mientras el alta interna y la edición usan isValidPassword (usuarioController.js:389,
489, 503). El JSDoc de validatorHelper.js:37-41 dice "mismo criterio que el alta interna" y es falso.
[MEDIO] Teléfono y patente: el FE acepta lo que el BE rechaza
Evidencia: teléfono agregar_empleado.jsx:108 /^[+]{0,1}[0-9\s-()]+$/ frente a validatorHelper.js:62
/^\d{7,15}$/. Patente agregar_vehiculo.jsx:23 frente a validatorHelper.js:69-71. El formulario se pone en
verde y el guardado da 400.
[MEDIO] Las mismas reglas reescritas en cada formulario, y el módulo compartido se borró (acredita a frontend-
componentes por las validaciones de usuario ya divergentes)
Evidencia: la regex "solo letras" aparece 8 veces en 5 archivos, la de especiales en 7 y el schema de garage está
copiado en 4 formularios con variantes. agregar_usuario.jsx:152 aplica .test(v?.trim()) y
agregar_empleado.jsx:98 / agregar_admin_sede.jsx:69 aplican .test(v) sin trim, así que el mismo email con un
espacio vale para el superadmin y no para el admin. El commit 9b7d8cc "limpieza: borrar … validators" eliminó
src/validators/index.js (COMMON_RULES.lettersOnly, emailFormat, phoneFormat, patenteFormat,
horaBefore…).
Impacto: borraron la única fuente compartida por "no tener referencias", en lugar de migrar los formularios a usarla.
[MEDIO] Sistema de diseño documentado pero no aplicado. Ver el Test del color.
[MEDIO] CSS global sin aislamiento: la misma clase definida distinto en 4 archivos
Evidencia: .boton-back está en formulario_PerfilPersonal.css:56 (46px, radio 14),
admin_panel_de_control.css:40 (44px, radio 12), gestion_de_empleados.css:17 y nueva_reserva.css:36. Como
los CSS se cargan por ruta, el botón cambia según el orden de navegación. Hay 435 !important, 163 de ellos en
gestion_usuarios.css.
[MEDIO] El FE reimplementa estados del dominio que no existen
Evidencia: helpers/qrReserva.js:1-12 habilita el QR con 11 o más estados
("activa","activo","confirmada","confirmado","confirmed","pendiente","dentro","ingresado",…) y usa
"confirmada" como default (:53). El BE solo maneja pendiente_pago|confirmada|expirada|cancelada.
helpers/controlAcceso.js:1-17 prueba 15 claves posibles.
Impacto: la regla de quién puede ingresar vive en el cliente con estados inventados, y el default permisivo habilita el
QR si falta el dato.
[MEDIO] Nomenclatura y estructura de carpetas del FE con tres convenciones superpuestas (entrada unificada:
repositorio + frontend-arquitectura + frontend-componentes + calidad-codigo)
Evidencia: components/ (6), componentesCompartidos/ (10) y componentesShared/ (2). pages/ junto a
vistasLanding/, assets/ junto a Imagenes/, helpers/ junto a util/. Typo central servicies/ (reconocido en
AGENTS.md como "typo histórico, no renombrar"). Carpetas con ñ (componentesDueñoGarage/,
vistasDueñoGarage/) que conviven con duenio_garage_dashboard.jsx. Hay 56 .jsx en PascalCase y 68 en
snake_case dentro de las mismas carpetas, y typos exportados: TablaReservasPanleControl, FooterBotton.
AGENTS.md dice "Componentes en PascalCase" y no se cumple.
[BAJO] Escalas ad-hoc: 27 border-radius, 101 font-size, 195 box-shadow y 24 breakpoints distintos.
helpers/toast.js existe, pero hay 48 Swal.fire({toast:true}) inline, y la opción zIndex (inexistente en Swal v11, como
dice el propio index.css:249-252) se pasa 39 veces. El linter usa la config del template, no hay Prettier y conviven comillas
simples y dobles. Hay un parche de dark mode aislado con contraste de aproximadamente 1:1 y el comentario falso /*
Slate 50 */ sobre #0F1A2E (gestion_usuarios.css:639-651).
[SUGERENCIA] Accesibilidad: la base es buena (184 aria-label). Revisar los <img onClick> de los headers, que deberían
ser enlaces.

2.8 Base de datos — 7/10
Re-entrega 2026-10-16 (6dc8c20). Antes: 6/10 parcial, con un ALTO por esquema no reproducible. El grupo
entregó docs/schema.sql (567 líneas, snapshot del catálogo de Supabase, "no es una salida de pg_dump directo",
:1-4), docs/roles.sql (seed transaccional de roles 1-5 con verificación DO $$ … RAISE EXCEPTION y setval),
docs/source-permissions.json (ACLs originales) y una cabecera de 2 líneas en docs/database-schema-.txt que
lo declara "vista parcial histórica". Sube a 7 porque la base ahora se levanta desde el repo con dos scripts, que era
el bloqueante. No sube más porque se resolvió el artefacto y no la gestión: no hay README que diga qué ejecutar,
las referencias apuntan a una carpeta inexistente, conviven tres fuentes sin reconciliar y ninguno de los problemas
de diseño se tocó (era esperable: el pedido era el dump).
Fuente principal: docs/schema.sql + docs/roles.sql. Contraste: docs/database-schema-.txt, que un parser propio
confirmó idéntico en estructura (mismas 24 tablas, 227 columnas, 84 constraints con nombre y 37 índices; solo cambian
serial vs nextval y el orden de DEFAULT/NOT NULL), pero sin tipos, funciones, RLS ni comentarios. Secundaria: 19
migraciones, sin cambios desde 8d14864. Confianza: alta, verificada por ejecución. Esquema reconstruido, inventario de
ids y tabla de coherencia completos en hallazgos/auditor-base-datos.md. Resumen de coherencia: 12 de 31 conceptos
compartidos son coherentes en nombre y tipo (se sumó "nombre de rol", incoherente). Hay 5 estrategias de PK (15
serial, 2 identity by default, 2 identity always, 1 bigserial y 4 uuid), y la convención id_<entidad> se respeta
en 34 de 41 columnas de referencia. Las líneas citadas en esta sección son de docs/schema.sql salvo indicación.
Verificación por ejecución
Ejecutada por el orquestador en PGlite 0.5.10 (PostgreSQL 18.6 en WASM) sobre una base limpia, con scripts en el
scratchpad (el repo no se tocó).
Prueba Resultado
docs/schema.sql OK, sin errores. 24 tablas, 7 ENUM, 3 funciones, 2 triggers, 36 FKs (coincide con el conteo estático).
en base vacía
docs/roles.sql OK e idempotente: deja 1 admin, 2 empleado, 3 garagista, 4 smartlot, 5 dueño_garage; corrido dos veces no
cambia nada y la verificación DO $$ no salta.
RLS Activo en las 24 tablas (relrowsecurity = true) con 0 policies. Equivale a "deny all" por PostgREST para
anon/authenticated; el backend entra con DATABASE_URL/service_role y hace bypass. Coherente con
la arquitectura (el FE no habla directo con Supabase). Dominio de auditor-seguridad: solo se anota.
docs/database- Falla en la primera sentencia con enum: type "public.dia_semana" does not exist. Confirma el ALTO
schema-.txt (fuente original y justifica la cabecera "no usar para restaurar".
anterior)
migrations/ desde 2/19 OK. La primera falla con relation "garages" does not exist: no hay migración base.
base vacía
migrations/ sobre 13/19 OK. Fallas: 20260806_001 obsoleta (id_sede ya no existe);
schema.sql 20260904_001_solicitud_modificacion con syntax error at or near "NULLABLE" (error real,
sigue sin corregir); 20260904_002_seed_consumos_pendientes_test atada al fixture "usuario 117,
empresa 5…"; 20260923_001 no idempotente (constraint … already exists). Dos más
(20260904_001_pagos_pasados_test, 20260918_003_reservas_qr_token) fallan por extension
"pgcrypto" is not available: limitación del entorno (PGlite no trae pgcrypto, Supabase sí), no se cuentan
como error del grupo.
Smoke test Insertar marca y modelo funciona; vehiculos queda con sus NOT NULL esperados y el trigger completa
tipo_vehiculo desde el modelo.
Conclusión: el esquema es reproducible desde schema.sql + roles.sql. migrations/ no sirve ni como camino desde
cero ni como camino incremental limpio sobre el baseline.

[ALTO] La relación pago ↔ consumo se modela de 3 formas y ninguna es relacional (se mantiene; acredita a
seguridad y a frontend-estandares por la explotación)
Evidencia: cuentaCorrienteService.js:43-77 combina pagos.id_reserva (FK, schema.sql:413), pagos.metadata-
>consumos_ids (array dentro de un jsonb, :172, con un índice GIN dedicado en :448) y un regex sobre
id_orden_externa (/ADMIN-PAGO-(\d{4}-\d{2})-G(\d+)-S(\d+)/, cuentaCorrienteService.js:71). La migración
20260904_003_repair_seed_payment_links.sql existe para reparar esos vínculos a mano. El baseline completo
confirma que no hay tabla puente.
Impacto: la relación N:M no tiene tabla puente, así que la DB no impide que un pago apunte a un consumo
inexistente ni que un consumo se pague dos veces. Un array en jsonb es, en la práctica, un campo multivaluado.
[MEDIO] El esquema es reproducible, pero no hay una fuente de verdad declarada y conviven 3 fuentes (antes
ALTO "esquema no reproducible", falla B1 resuelta)
Evidencia:
Referencias rotas: docs/schema.sql:3 remite a database/README.md y docs/database-schema-.txt:2 a
../database/schema.sql y ../database/README.md. La carpeta database/ no existe ni existió nunca en el
historial (git log --all -- '*database/*' solo encuentra src/database/db.js). El "README de
procedencia" y el script o query que generó el snapshot no están commiteados: el baseline no se puede
regenerar.
3 fuentes: el .txt (estructura idéntica, no ejecutable), schema.sql (ejecutable) y migrations/ (no
reconstruye la base). Ningún README declara cuál manda ni el orden "schema.sql → roles.sql".
migrations/README.md:3 sigue diciendo "Aplicar los archivos por nombre".
migrations/ sin cambios: 20260904_001_solicitud_modificacion.sql:7 sigue con INTEGER NULLABLE;
siguen los prefijos duplicados (20260904_001 ×2, 20260918_001 ×2), el seed atado a IDs de su base, la
migración no idempotente y la obsoleta. Las divergencias con el baseline (pagos sin el CHECK de monto ni los
defaults de la migración, FK trato_empresa_garage_id_sede_fkey vs fk_trato_sede en schema.sql:426,
índices de migración que no están en el baseline) siguen sin explicación.
Catálogo incompleto: EmailTemplateService.js:18-24 devuelve 404 si falta el codigo, pero las filas de
email_templates solo se siembran en migrations/20260814_001_email_templates.sql:22 y
20260918_001_email_solicitud_superadmin.sql:8. Con schema.sql + roles.sql la base levanta pero los
emails no funcionan, y nada avisa que hay que correr esas dos migraciones.
Impacto: el bloqueante está resuelto y se reconoce. Pero un compañero nuevo sigue sin saber qué ejecutar, hay dos
copias del mismo esquema que van a divergir con el próximo cambio y una carpeta migrations/ que parece la fuente
oficial y no lo es.
[MEDIO] Nomenclatura: 20 columnas en PascalCase con comillas y dos idiomas en la auditoría (se mantiene,
confirmado)
Evidencia: "Borrado" en 11 tablas; "DeleteBy", "UpdateBy", "DeleteAt" y "UpdateAt" en empresas (:87-90) y
usuarios (:307-310); "SuperAdmin" en conflictos (:45). Hay 136 referencias a "Borrado" escritas a mano en el
código, tablas en inglés (email_templates, password_reset_codes, refresh_sessions) frente a 21 en español, ñ
en identificadores ("contraseña" :302, "contraseña_hash" :266) y ENUMs con y sin sufijo _enum (5 contra 2).
[MEDIO] Enumerados y roles: "estado" de 4 formas y el vocabulario de roles no coincide entre seed, backend y
frontend (se mantiene, con evidencia nueva; acredita a calidad-codigo por los roles mágicos en el código)
Evidencia:
Estados: ENUM (solicitudes.estado :254, reservas.estado_reserva :224), varchar + CHECK
(conflictos.estado :351, con 'Pendiente','En Proceso','Resuelto') y texto libre
(solicitudes_registro.estado :269, reembolsos.estado :191, solicitudes.tipo_solicitud :256,
notificaciones.tipo :150). Nuevo: el enum estado_solicitud (:11) tiene exactamente los 4 valores
(pendiente/aceptada/rechazada/cancelada) que solicitudes_registro.estado text valida a mano en
helpers/estadosSolicitud.js:1-6. El tipo existía y no se reutilizó.

Choque de vocabulario de roles (nuevo, verificado por el orquestador): docs/roles.sql:4-8 fija
2='empleado' y 4='smartlot'; el backend define ROLE_NAMES.CLIENTE = 'cliente' y
ROLE_NAMES.SUPERADMIN = 'superadmin' (helpers/roles.js:3,6), y rolesMiddleware.js:11 documenta "2
= cliente". El FE usa 'empleado' y resuelve smartlot con un alias (frontend/src/helpers/roles.js:2,7).
Consecuencias:
Las ramas por nombre ROLE_NAMES.SUPERADMIN (más de 20 usos, p. ej. garageController.js:38) y
ROLE_NAMES.CLIENTE (tratoEmpresaGarageController.js:12) nunca matchean; solo funcionan por el
ID numérico que las acompaña. usuarioRepository.js:314 (u.id_rol = 4 OR
lower(trim(r.tipo_rol)) = 'superadmin') tiene la segunda condición muerta.
Bug visible: tratoEmpresaGarageService.js:13 define ROL_LABEL = { admin, superadmin } y en
:114 (y :149) hace ROL_LABEL[usuario.tipo_rol] ?? 'admin'. Como authMiddleware.js:27,51
carga tipo_rol = 'smartlot', la notificación al dueño del garage dice "El admin X modificó su trato"
cuando lo hizo el superadmin.
roles.tipo_rol sigue sin UNIQUE (:232) aunque el código consulta por nombre
(solicitudEmpresaGarageRepository.js:25, usuarioRepository.js:90).
A favor: el seed versionado fija los IDs con verificación, así que el riesgo "si se recrea roles, id_rol = 3 deja
de ser garagista" queda cubierto.
Impacto: el código "cubre los dos casos" (ID y nombre) y uno es silenciosamente falso. El grupo ya tiene la fuente de
verdad (el seed), pero el backend no se alineó con ella.
[MEDIO] FKs con tipo distinto a la PK referenciada (se mantiene, confirmado)
Evidencia: conflictos.id_usuario bigint (:39) apunta a usuarios.id integer. consumos_reserva.id_trato
integer (:51) y solicitudes.id_trato integer (:257) apuntan a trato_empresa_garage.id bigint (:276),
mientras reservas.id_trato (:218) e historial.id_trato (:125) son bigint.
[MEDIO] Mezcla timestamp / timestamptz, incluso dentro de la misma tabla (se mantiene)
Evidencia: hay 9 columnas sin TZ frente a 22 con TZ. En reservas conviven fecha_salida timestamp (:213) y
retencion_pago_hasta timestamptz (:225) dentro del mismo índice (:458). El parche está en
config/timezone.js:1-9 (process.env.TZ = 'America/Argentina/Buenos_Aires').
[MEDIO] El código no conoce su propio esquema, y el baseline trae una función SQL que nadie llama (se mantiene
+ nuevo)
Evidencia: ConflictoRepository.js:8-22 consulta information_schema.columns en runtime para averiguar cómo
se escribe superadmin, cuando el baseline dice "SuperAdmin" (:45). ConflictoRepository.js:88-90, 229-230,
266-272 escribe "DeleteBy"/"DeleteAt" en conflictos, columnas que el baseline confirma que no existen
(:37-46), y el catch de 42703 (:95, 240, 279) cae siempre en el fallback. cuentaCorrienteRepository.js:94
captura 42P01 para pagos, que el baseline sí crea. Hay 130 COALESCE("Borrado", false) sobre columnas NOT
NULL en 10 de 11 tablas (el baseline lo repite en el índice uq_garage_propio_sede, :441).
Nuevo, función muerta y duplicada con otra regla:
public.reset_password_invalidate_anteriores(usuario_id integer) (schema.sql:473-483) no se invoca en
ningún archivo del repo. usuarioRepository.js:326-333 reimplementa lo mismo inline agregando AND expires_at
> NOW(), que la función no tiene: la misma regla de negocio en dos lugares con dos comportamientos. Además es la
única de las 3 funciones sin SET search_path (contra :488 y :503) y nombra su parámetro usuario_id cuando el
esquema usa id_usuario.
[MEDIO] Datos derivables guardados sin sincronización
Evidencia: reservas.dia llega del cliente y nunca se cruza con fecha_entrada (reservaService.js:654,662,797),
así que se puede reservar un lunes con dia='Sabado' y pasar el control de días hábiles. garages.ocupacion_* se
mantiene con ±1 desde el código (garageRepository.js:305,329,339), con GREATEST(0, …) en un decremento y
sin él en otro, y sin CHECK. El contraste es vehiculos.tipo_vehiculo, que está bien resuelto con un trigger.
[MEDIO] Dominios y obligatoriedad sin proteger en las tablas centrales

Evidencia: reservas.id_usuario/id_garage/id_vehiculo/fecha_entrada/fecha_salida son todas nullable (:209-
213). No hay CHECK (fecha_salida > fecha_entrada). usuario_garage tiene ambas FKs nullable y no tiene
UNIQUE compuesto (:288-292), y el duplicado se evita con un SELECT 1 no atómico. trato.cantidad_cocheras no
tiene CHECK > 0, a diferencia de solicitudes.
[BAJO] Las columnas de auditoría ("DeleteBy"/"UpdateBy") no tienen FK y están solo en 2 de 11 tablas.
solicitudes_registro usa text donde el destino es varchar(255), así que falla al aprobar. Hay seeds de prueba con IDs
de un entorno concreto mezclados con las migraciones (20260904_002_seed_consumos_pendientes_test.sql:27-40, y :11
crea responsable_pago como text).
[SUGERENCIA] Índices redundantes sobre columnas UNIQUE (:371-372 vs :449-450, :375 vs :453;
idx_refresh_sessions_id indexa la PK, :454). Precios en integer frente a tarifas en numeric. "SuperAdmin" es un
boolean de tres valores. notificaciones.id_relacion es polimórfica sin FK.
2.9 Calidad de código — 5/10
Métricas: el BE tiene 84 .js en src/ y el FE 197 .js/.jsx (28k líneas solo de JSX). Archivos más largos del BE:
reservaService 914, usuarioService 716, usuarioController 539, paymentController 535. Del FE: gestion_usuarios
1355, garagista_dashboard 1260, admin_reportes_analisis 1170. Hay 34 console.log en el BE (22 son 'Estoy en:
X.constructor()'), 0 TODO/FIXME y casi nada de código comentado.
[ALTO] La fábrica de errores HTTP está copiada 25 veces, en dos variantes que ya divergieron
Evidencia: la variante throwError (function throwError(message, statusCode) { const error = new
Error(message); error.statusCode = statusCode; throw error; }) está en 12 controllers (AuthController.js:9,
empresaController.js:9, marcaController.js:9, paymentController.js:15, usuarioController.js:14…). La
variante fail con Object.assign aparece en 13 lugares (solicitudEmpresaGarageController.js:9,
repos/NotificacionRepository.js:4, cuentaCorrienteService.js:3… y dos veces dentro de métodos de
garageService.js:40, :81). Además hay 38 throw Object.assign(new Error(...)) inline. Unas copias traen
statusCode = 400 por defecto (solicitudEmpresaGarageController.js:9) y otras no
(solicitudEmpresaGarageService.js:8), así que olvidar el argumento da 400 en un archivo y 500 en otro.
[ALTO] FE: conviven tres generaciones de servicies/ y la más vieja se come el error del backend (acredita a
frontend-arquitectura)
Evidencia: la Gen. 1 (let returnObject = { respuesta: false, datos: [] } + logApiError local, copiado en 11
archivos) está en 10 API_*.js, y 50 de sus 73 catch descartan el mensaje y el status del BE (API_Marca.js:120-
122; Empresa, Rol, Sede y Vehiculo al 100 %). La Gen. 2 (crearRespuesta) está en API_Conflicto.js:6. La Gen. 3
(result/mutate) está en API_Notificacion.js:7,15 y otros 4, con el helper genérico copiado en 5 archivos.
Dentro de API_Garage.js conviven :21 (verboso) y :51 (compacto).
Impacto: la pantalla de Marcas no puede mostrar el mensaje de validación del BE y la de Garages sí. El mismo bug está
arreglado solo en algunos módulos.
[ALTO] Helpers de vista copiados de 7 a 12 veces en el FE, con copias ya divergentes (acredita a frontend-
arquitectura y a frontend-estandares)
Evidencia: obtenerListado ×12 (por ejemplo tabla_reservas_panelControl.jsx:13,
admin_panel_de_control.jsx:36, nueva_reserva.jsx:50…), obtenerIdUsuario ×10 con 2 órdenes de precedencia
(admin_panel_de_control.jsx:45 vs gestion_de_empleados.jsx:58), obtenerIdGarage ×7
(duenio_garage_dashboard.jsx:24 cae al index del array) y esValorVerdadero ×7 (existe en
helpers/qrReserva.js:20 pero no se exporta). Hay formatearFecha ×7 con 3 formatos y 2 fallbacks, aunque
existe helpers/reservaDateTime.js:68 formatReservaDate. Hay 6 formateadores ARS locales aunque existe
helpers/prices.js:17 formatARS.
[MEDIO] Roles como números mágicos, mezclados con constantes en la misma línea

Evidencia: 73 requireRole(...). garageController.js:38 requireRole(1, 4, ROLE_NAMES.ADMIN,
ROLE_NAMES.SUPERADMIN). Hay 12 Number(id_rol) === 4 que conviven con 15 hasRole(usuario, 4,
ROLE_NAMES.SUPERADMIN) y con helpers locales (isRequestSuperadmin, esRequesterSuperadmin). Además, el rol 2 es
CLIENTE en el BE (helpers/roles.js:3) y EMPLEADO en el FE (helpers/roles.js:2), y el BE lo parchea con
['cliente','empleado'].includes(...) (usuarioController.js:304). El seed re-entregado (docs/roles.sql)
confirma que la base dice empleado y smartlot: ver 2.8 por las ramas muertas y el bug de la notificación.
[MEDIO] Nomenclatura del BE: idiomas y casing mezclados
Evidencia: createAsync vs crearAsync (NotificacionService.js:36), deleteAsync vs eliminarAsync y
cancelAsync vs cancelarAsync. AuthController.js, ConflictoController.js y ConflictoService.js
(PascalCase) conviven con garageController.js y marcaService.js. La parte FE está en Estándares.
[MEDIO] Comentarios y nombres que afirman cosas falsas (acredita a arquitectura-backend por dbClient.js y a
frontend-estandares por los ADR)
Evidencia: validatorHelper.js:28-33 dice "al menos 6 caracteres" y la regex exige 8 con mayúscula, minúscula y
dígito. errorHandler.js:13 loguea [MP] 404 para cualquier 404. marcaController.js pasa req.usuario a
deleteAsync, que lo ignora. rolesMiddleware.js:8-11 y reservaController.js:16-21 documentan "1=admin,
2=cliente, 3=garagista" y omiten los roles 4 y 5. // GET BY ID sobre /auditoria (empresaController.js:22,
usuarioController.js:272).
[BAJO] 22 console.log('Estoy en: …constructor()') y COALESCE("Borrado", false) = false repetido 58 veces.
Código muerto: requireAdmin (rolesMiddleware.js:64) y 3 plantillas de email legacy en emailService.js. Estilo
inconsistente dentro de archivos (app.js:1-12 mezcla comillas, ; y tabs, y la indentación 2/4 aparece mezclada en
paymentController.js). El BE no tiene linter.
[SUGERENCIA] Tests que verifican el texto del código, no su comportamiento
Evidencia: 13 de 20 tests del BE y 9 del FE hacen readFile + regex. test/garage-sin-sede.test.js:21-27 recorta
garageController.js entre dos comentarios. servicies/API_Reserva.source.test.js:10-11 exige un formato
exacto. Conviven con tests de comportamiento genuinos (reservationPolicy.test.js, reservaDateTime.test.js,
reservation-limit.integration.test.js).
3. Propuestas de descomposición (God classes / God components)
Material para explicar SRP en la devolución presencial con el código del propio grupo. Regla mnemotécnica: "si para
describir la clase necesitás la palabra 'y', son dos clases" / "un componente = una cosa que le podés explicar a
alguien en una frase".
3.1 Backend
ReservaService (914 líneas, ~33 métodos)
Responsabilidades mezcladas: consultas de reservas, ciclo de vida (crear/cotizar/cancelar/expirar), control de acceso físico con
QR, validación de disponibilidad. A eso se suma la cotización, que hoy está en el repository.

Clase/módulo propuesto Responsabilidad Métodos reales que se llevaría
ReservaService (queda) consultas y CRUD de la reserva getAllAsync, getByIdAsync, getByUsuarioAsync,
getByUsuarioWithDetailsAsync, getActivasByUsuarioAsync,
updateAsync, deleteAsync, cancelarAsync
CotizadorReservaService precio, cupo y responsable de quoteAsync, createAsync + la lógica de
pago (regla única para crear y reservaRepository.quoteAndCreateWithClientAsync
editar) (líneas 53-64)
AccesoGarageService ingreso/egreso físico y QR getQrAsync, _parseQrToken, checkInByQrAsync, checkOutByQrAsync,
checkInAsync, checkOutAsync, _validarAccesoGarageAsync,
_validarReservaParaAccesoAsync, getControlAccesoAsync
DisponibilidadReservaValidator reglas de _validarCamposObligatorios, _validarFechasAsync,
fechas/capacidad/solapamiento _validarRelacionesAsync, _validarDisponibilidadAsync,
_validarGarageDisponible, _validarCapacidadTotalActualGarage,
getDisponibilidadPorHoraAsync
RetencionPagoJob barrido periódico de retenciones iniciarExpiracionAutomatica, liberarRetencionAsync (y absorber el
vencidas UPDATE duplicado de paymentController:223)
UsuarioService (716 líneas, ~22 métodos)
Responsabilidades mezcladas: gestión de usuarios, emisión de tokens y sesiones, recupero de contraseña por código, reglas
de integridad que dependen de reservas (de ahí la dependencia circular).
Clase/módulo Responsabilidad Métodos reales que se llevaría
propuesto
UsuarioService alta/baja/modificación y getAllAsync, getByIdAsync, createAsync, updateAsync, updateEstadoAsync,
(queda) consultas deleteAsync, getGaragistasByGarageIdAsync, updateReservationLimitAsync,
getAuditAsync, _validarRelacionesAsync, _aplicarReglasDeActualizacion
AuthService login y sesiones loginAsync, refreshTokenAsync, revocarRefreshTokensAsync, loginConCodigoAsync
+ el login Google que hoy está en AuthController
TokenService (helper) firmar access/refresh y los 3 bloques jwt.sign copiados en usuarioService (91, 166, 501) +
crear sesión signTokens/createSession de AuthController
RecuperoClaveService códigos de verificación y solicitarRecuperoAsync, restablecerClaveAsync
reseteo
(regla en "¿el usuario tiene _validarSinReservasActivasAsync, _validarSinReservasAsync → que las pida al revés y
ReservaService) reservas?" se corte el ciclo
paymentController (535 líneas, 5 funciones + 6 rutas)
Responsabilidades mezcladas: endpoints HTTP, persistencia de pagos y reembolsos, procesamiento del webhook y
confirmación de reservas, y la regla de sandbox.

Clase/módulo propuesto Responsabilidad Funciones reales que se llevaría
paymentController (queda) solo HTTP: leer req, llamar las 6 rutas: POST /preference, GET /webhook-events, GET
service, responder /:paymentId, POST /webhook, POST /:paymentId/refund, GET
/
PagoRepository SQL de pagos, reembolsos, savePaymentRecord (solo la parte SQL),
webhook_eventos updatePaymentStatus, logWebhookEvent,
markWebhookProcessed, INSERT de reembolsos (474)
PagoService orquestar MP + BD, regla lógica de POST /preference (216-316), refund (470-489),
sandbox, armar preferencia sincronización de GET / (512-524)
para reserva
ConfirmacionPagoReservaService (o regla "pago aprobado + persistPaymentAndConfirmReservation
método de ReservaService) retención vigente → confirmar"
3.2 Frontend
gestion_usuarios (1.355 líneas, 21 useState, 8 useEffect)
Responsabilidades mezcladas: carga de 4 catálogos, listado con 5 filtros en un popover, panel de auditoría, archivados,
bandeja de solicitudes de registro, aprobar/rechazar, archivar/restaurar/eliminar y "login as".
Pieza propuesta Responsabilidad Qué se lleva (real)
useUsuariosAdmin carga y normalización estados usuarios, empresaMap, sedeMap, garageMap, loading, error;
(hook) loadData (:244), recargarUsuariosYEmpresas (:319),
normalizarUsuario (:158)
useFiltrosUsuarios filtros en cascada searchTerm, selectedRol/Empresa/Sede/Garage; memos
(hook) empresasDisponibles/sedesDisponibles/garagesDisponibles
(:362-400), los 3 useEffect de reseteo (:401-418), usuariosFiltrados
(:419)
UsuariosToolbar búsqueda + popover de JSX :866-1015, showFilters, el useEffect de click afuera (:216)
filtros
UsuarioCard tarjeta de la grilla el .map de :1016 en adelante, ROLE_CLASSES/ROLE_LABELS
ModalArchivados listar/restaurar/eliminar showArchived, searchArchivedTerm, usuariosArchivados,
(compartido con archivados handleRestaurar, handleEliminar, JSX :1144-1244
gestion_de_empleados)
BandejaSolicitudes solicitudes de registro solicitudes, showSolicitudes, searchSolicitudesTerm,
de empresas resolviendoSolicitud, cargarSolicitudes,
handleAprobarSolicitud, handleRechazarSolicitud, JSX :1245-fin
ModalGaragesDueño garages de un dueño garagesModalUsuario, JSX :1137-1143
Además: borrar los useEffect de :342-360 y :755-770 (Escape + overflow), porque ModalPortal ya hace exactamente
eso.
garagista_dashboard (1.260 líneas, 20 useState)
Responsabilidades mezcladas: normalización de reservas y fechas, selección de garage (para admin), resumen operativo, 3
listas (pendientes / dentro / movimientos), verificación por patente, lector QR y doble rol (esAdmin aparece 35 veces).

| Pieza propuesta | Responsabilidad | Qué se lleva (real) |
| --------------- | --------------- | ------------------- |
helpers/reservasGaragista.js funciones puras de extraerFecha, normalizarEstadoReserva,
|     | fecha/estado | obtenerHoraEntradaReal, obtenerHoraSalidaReal, |
| --- | ------------ | ---------------------------------------------- |
estaReservaPendienteVencida… (:43-350)
useReservasGarage (hook) carga + refresco reservas, cargando, errorCarga, recargaReservas,
|     | por día | fechaISOActual, el useEffect de :579-668 |
| --- | ------- | ---------------------------------------- |
AccessCard tarjeta de reserva el JSX duplicado de :950-991 y :1015-1062; recibe meta y
|     | con acciones | onEscanear/onManual |
| --- | ------------ | ------------------- |
AccessSection encabezado + lista :938-1003 y :1004-1079 (hoy dos copias)
+ empty state
VerificacionPatenteModal ingreso/salida reservaSeleccionada, tipoVerificacion, patenteIngresada,
manual errorVerificacion, patenteVerificada, verificarPatente,
confirmarAcceso, confirmarSalida, JSX :1124-1216
SelectorGarageAdmin solo para el rol garagesDisponibles, garageSeleccionadoId,
|     | admin | cargandoGaragesAdmin |
| --- | ----- | -------------------- |
admin_panel_de_control (883 líneas, 20 useState) + superadmin_conflictos (583)
Responsabilidades mezcladas: ocupación total, tabla de conflictos con papelera, toast con deshacer, modal de soporte, tabla
de reservas y botón de reportes.
| Pieza propuesta | Responsabilidad | Qué se lleva (real) |
| --------------- | --------------- | ------------------- |
useConflictos(scope) (hook) carga, papelera, conflictos, papelera, loadingConflictos, cargandoPapelera,
cambiar estado, actualizandoId, conflictosResolviendo, cargarPapelera
|     | eliminar, restaurar | (:218), handleCambiarEstado (:385), handleEliminar, |
| --- | ------------------- | --------------------------------------------------- |
handleRestaurar
TablaConflictos (compartida tabla + tabs JSX ~600-811 / ~380-570, ConflictsTableSkeleton,
admin/superadmin) Activos/Papelera + prioridadClase, estadoClase, formatearFecha
búsqueda
ModalReporteSoporte crear conflicto modalSoporteOpen, nuevoConflicto, enviandoConflicto,
(compartido con mensajeSoporte, handleCrearConflictoSuperadmin
empleados_dashboard)
ToastUndo (ya existe) deshacer reemplaza mostrarToast + toastTimeoutRef + el JSX inline de
:810-820
useStaleIndicator (hook) "actualizado hace X" ultimaActualizacion, tiempoTranscurrido, isStale

empleados_dashboard (861 líneas, 26 useState)
Pieza propuesta Responsabilidad Qué se lleva (real)
useDatosEmpleado (hook) perfil, vehículos, perfilUsuario, vehiculos, marcas, modelos, garages,
marcas, modelos, garagesSede, garageUsuario, el useEffect de :331
garages
DisponibilidadPanel elegir garageSeleccionadoId, fechaSeleccionada, horaSeleccionada,
garage/fecha/hora y ver disponibilidadHoras, cargandoDisponibilidad,
cupo handleGarageDashboardChange, handleFechaChange,
handleHoraChange
ReservasDelDia lista de TarjetaReserva reservas, loadingReservas, refreshError, handleReservaClick,
handleCopyReserva
ModalReporteSoporte (el reporte de problema modalReporteOpen, descripcionReporte, prioridadReporte,
mismo que admin) enviandoReporte, mensajeReporte, handleEnviarReporte (:642),
JSX :786-840
admin_reportes_analisis (1.170 líneas)
Pieza propuesta Responsabilidad Qué se lleva (real)
helpers/reportes.js cálculos puros (testeables calcularHorasEntre, sumarOcupacionPorHora,
con node:test, que el obtenerRangoPeriodo, calcularHorasPico,
proyecto ya usa) seSolapaConRango… (:100-290)
util/graficoTendenciaPng.js dibujo del PNG para el PDF generarGraficoTendenciaPng (:408-527)
KpiGrid, TendenciaChart, secciones visuales JSX de :1007-1090+, CustomTooltip, CustomDot,
PeriodNavigator AnimatedNumber, navegarAtras, navegarAdelante
Para la devolución al alumno: 3 clases del backend y 6 vistas del frontend "hacen demasiado" (sin nombrarlas).
4. Fortalezas
Backend y seguridad
Sin SQLi: todas las queries usan $n. Los fragmentos dinámicos (tenantFilter.js, garageRepository.js:18-26,
columnas en reservaRepository.js:59,200) se arman con constantes o whitelists, nunca con input del request.
Autenticación sólida: bcrypt con 12 rounds (usuarioService.js:68), JWT en cookies httpOnly + secure en prod
+ sameSite=lax, access de 15 min, refresh en tabla con rotación y token_version. Rol y tenant se releen de la DB en
cada request (authMiddleware.js:26-54), así que un JWT viejo no conserva privilegios. No hay secretos con fallback
hardcodeado.
Registro público seguro: el servidor fija rol y tenant (usuarioController.js:294-321) y hay control de escalada de
privilegios en el alta por admin (:399-412). La impersonación es solo de superadmin y el retorno se valida con
impersonated_by firmado (:246-250).
Infraestructura: helmet con HSTS, redirect a HTTPS, CORS con whitelist, express.json({limit:'10kb'}), rate limit
en auth y un error handler que oculta los mensajes de los 500. El webhook de MP usa HMAC con timingSafeEqual y
vuelve a consultar el pago a la API.
Capas reales en los CRUD (marca, modelo, rol, sede, vehiculo, empresa, conflicto), con middleware de errores central
sobre Express 5 (15 de 17 controllers lanzan con statusCode), middlewares de auth y roles reutilizables y prefijos
/api/<recurso> consistentes.
Concurrencia cuidada: SELECT … FOR UPDATE en check-in/out y en la creación de reservas
(reservaService.js:407-484). El límite de reservas activas tiene un test de concurrencia real (reservation-
limit.integration.test.js).

Services de dominio con buenos status: unos 63 409 para conflictos de estado, más 403 y 404 bien elegidos, y
201 consistente en las altas.
Integraciones encapsuladas (MP, Mailtrap, Maps) con config por env y fallback a haversine si Google falla. app.js
es testeable con supertest.
Base de datos
La re-entrega resolvió el bloqueante: el esquema se levanta desde el repo, verificado por ejecución (24 tablas, 7
ENUM, 3 funciones, 2 triggers, 36 FKs, sin errores).
docs/roles.sql está bien escrito: transaccional, idempotente (corrido dos veces sin cambios), con IDs explícitos,
verificación de lo existente y ajuste de la secuencia. Es el patrón correcto para datos de catálogo de los que depende el
código.
COMMENT ON en tipos y columnas clave (schema.sql:10-17, 529-565) y funciones de trigger con SET search_path
TO '' y nombres calificados (:488, :503).
Las 24 tablas tienen PK y las 34 relaciones id_<entidad> tienen REFERENCES real.
ENUMs de dominio coherentes en el núcleo de negocio. Hay CHECKs de negocio sofisticados en reservas
(schema.sql:378-384: combinaciones de modalidad/cupo/responsable, retención solo para pagos pendientes, QR de
salida distinto del de entrada).
Índices únicos parciales que acompañan el soft delete. consumos_reserva es un snapshot inmutable con decisión
documentada (README.md:7). La redundancia de vehiculos.tipo_vehiculo se controla por trigger.
historial_modalidad_trato tiene RESTRICT/SET NULL elegidos con criterio. Hay migraciones recientes
idempotentes con RAISE EXCEPTION de verificación.
Frontend
Cliente HTTP único (api/client.js): baseURL por entorno, withCredentials, timeout, refresh con cola
failedQueue y toasts solo en mutaciones con dedupe. La URL del backend no está hardcodeada en ningún
componente.
Caché propia razonada (cache/cacheStore.js): TTL, dedupe de requests en vuelo y descarte de respuestas
invalidadas a mitad de camino.
Sesión sin tokens en el front (ADR-002 verificado). AuthProvider usa AbortController, se protege del doble
montaje de StrictMode y reintenta ante el cold start de Render (con tests).
Routing: lazy() en todas las vistas menos la landing, ProtectedRoute con ?redirect=, ErrorBoundary y roles y
rutas home centralizados en helpers/roles.js (con tests).
Componentes reutilizables de verdad: EmptyState (52 instancias en 25 archivos, API bien pensada),
FormularioZona/FormularioCapacidad/FormularioPreciosGarage compartidos entre 4 vistas, useLiveValidation
en 17 formularios y componentes del empleado bien separados de su vista. No hay componentes definidos dentro de
otros.
Lógica de dominio en helpers puros con tests de comportamiento (reservationPolicy, prices, patente,
reservaDateTime, qrReserva, controlAcceso).
Ubicación correcta de la lógica en dos flujos clave: el límite de reservas vive en el servidor (409 con code) y el FE
solo lo traduce, y el importe de la reserva del empleado lo recalcula el BE. El registro público está alineado FE↔BE.
Landing con tokens Tailwind brand-* aplicados de forma consistente y sin clases arbitrarias.
Repositorio y proceso
No hay secretos filtrados en ningún repo. El FE tiene .gitignore, .env.example y README ejemplares.
Poda deliberada 9b7d8cc (17 archivos, 1.662 líneas): exactamente el hábito que busca la materia.
Bug real arreglado y documentado: el orden de rutas /papelera antes de /:id (garageController.js:71-72,
commit 5ed5e32).
Scripts check-* cableados en package.json (check:env detecta placeholders y variables prohibidas en prod). Hay
tests en los dos repos, una colección Postman y migraciones con README.

5. Indicios de uso de IA sin comprensión
Veredicto global: FUERTES en zonas acotadas, LEVES en el resto. El uso de IA es intensivo y declarado
(.agents/skills, .claude/skills, opencode.json, AGENTS.md, skills-lock.json en ambos repos), y la
comprensión es despareja. No es un proyecto "copiado sin entender" en bloque. Es un proyecto construido con un
agente por pedidos sucesivos ("collage por sesiones": tres dialectos de controller, cuatro sistemas de tokens CSS),
con alguien que revisa y poda a veces y con zonas donde nadie leyó el resultado. El 59 % de los commits es de
"Android Studio": la defensa tiene que establecer primero quién hizo qué.
Advertencia metodológica: 66e842d (BE) y 9a0fa4b (FE) son raíces injertadas del clon shallow y no se usaron
como señal.

Mapa de indicios
Zona/Archivo(s) Nivel Señales convergentes
paymentController.js + mpService.js (BE) FUERTE resto de chat en un comentario, tercer dialecto
(inglés, 2 espacios, try/catch+next), variable sin
usar, console.warn didácticos
database/dbClient.js (BE) FUERTE comentario justificador falso que los propios tests
refutan → pool duplicado en producción
Documentación FE (70a3683: ADR-001..006, DESIGN.md, FUERTE +1480 líneas en un commit, ADRs todos fechados
PRODUCT.md, AGENTS.md, docs/*) 2026-10-09, instalados justo después de la skill
documentation-and-adrs; ADR-004 y
DESIGN.md describen cosas que no existen
Tests *.source.test.js (FE, 9) y tests BE con readFile FUERTE regex sobre el código fuente: verifican que el
(13 de 20) código "diga" algo, no que funcione
Field-guessing en vistas FE (empleados_dashboard.jsx, FUERTE cadenas de 7-10 ??, 34 usos de ._id (Mongo)
controlAcceso.js, qrReserva.js y 9 más) en un proyecto Postgres, estados inventados en
inglés
reservaRepository.js:25-92 (BE) LEVE→FUERTE estilo minificado distinto al resto; FOR UPDATE +
(según defensa) comentario sobre READ COMMITTED
Middleware/roles (BE) LEVE comentario de roles 1/2/3 incompleto,
authMiddleware duplicado, requireRole(1,
4, ROLE_NAMES.ADMIN,
ROLE_NAMES.SUPERADMIN), 3 alias de ruta
contraseña
validatorHelper.js (BE) LEVE JSDoc "al menos 6 caracteres" sobre una regex de
8; "mismo criterio que el alta interna" falso
AuthController.signTokens/createSession (BE) LEVE access token firmado, descartado y vuelto a firmar
en createSession
Vistas de paneles FE (cuentas_por_cobrar, LEVE líneas de 1000-1900 caracteres con 4-12
admin_pagos, gestion_*) useState, comentarios de instrucción ("Se
mantiene intacto", "Conexión corregida…"), CSS
clonado por rol
Landing FE (LogoWatermark.jsx de 702 líneas, Catmull- LEVE sobre-ingeniería localizada frente a la falta de
Rom en reportes) componentes base compartidos
DB/migraciones (docs/database-schema-.txt, LEVE migraciones profesionales (DO $$, NOT VALID)
migrations/) con errores de base; DDL exportado el día de la
auditoría; 130 COALESCE("Borrado", false)
sobre NOT NULL
Re-entrega del DDL (6dc8c20: docs/schema.sql, LEVE→FUERTE referencias a una carpeta database/ que nunca
roles.sql, source-permissions.json) (según defensa) existió; 29 min entre la captura del snapshot y el
commit; cabecera "vista histórica" sobre un
archivo idéntico; seed que contradice al backend;
función SQL muerta duplicada en JS
Scripts de diagnóstico (diagnose-deal- LEVE scripts típicos de una sesión de agente depurando,
permissions.cjs, probe-request-route.cjs, versionados
verify-request-insert.cjs, 18 check-*.cjs)
tenantFilter.js, api/client.js, cacheStore.js SIN INDICIOS de coherentes y usados de verdad; solo hay que
incomprensión a confirmar que alguien los pueda explicar
priori: nivel senior,
verificar

Zona/Archivo(s) Nivel Señales convergentes
Poda 9b7d8cc, garageController.js:71-72, SIN INDICIOS (a ver más abajo
sinContraseña, whitelists favor)
Detalle por zona
[FUERTE] Pagos con Mercado Pago. paymentController.js:384: // No bloqueamos (usuario pidió permitir UUID),
pero avisamos en log. "Usuario pidió" es la voz del agente hablando de quien le hace los pedidos. Viene del commit
1964585 "testeando funcionalidades de mp" (Android Studio, 2026-08-28) y nadie lo leyó en 7 semanas. En :376-378 hay
un mensaje de error con instrucciones operativas ("Usa GET /api/payments?external_reference=TU_ORDER_ID…"), en tono de
asistente. Es un dialecto propio del archivo, tiene una variable sin usar (:445) y console.warn que recomiendan ngrok
(mpService.js:57-58). Interpretación prudente: integrar MP es difícil y es razonable apoyarse en IA, pero el comentario
delata que el texto se aceptó sin leerlo, y es justamente el módulo con el CRITICO de seguridad.
[FUERTE] dbClient.js. El comentario :2-3 dice que "mock.module de Node falla con módulos que usan export default", y
test/garage-responsables.test.js:4 (y reserva-qr.test.js:7, reserva-repository.test.js:41, reservation-
limit.integration.test.js:21) hace justamente eso. Viene del commit 44bf13b (Android Studio). Prudente: pudo haber
sido cierto con otra versión de Node, pero hoy es falso y cuesta un pool duplicado en producción.
[FUERTE] Documentación FE generada en bloque. 4b09e21 (Franco-Cappella) instala las skills documentation-and-adrs
y spec-driven-development, y el mismo día 70a3683 (Android Studio) agrega +1480 líneas: 6 ADR con la misma fecha que
documentan decisiones tomadas meses antes. ADR-004 (invalidación "centralizada") y ADR-005/DESIGN.md (tokens --
success/--error, "ningún componente define sus colores") son falsos frente al código. Contrapeso: ADR-007 (30be227,
Franco-Cappella) es manual, más chico y preciso, y 0d0e2cf muestra mantenimiento de la documentación.
[FUERTE] Tests que hacen regex sobre el fuente. landing.source.test.js:27-28: assert.match(landing, /const
locked = !isIntroComplete && !prefersReducedMotion/). Es el patrón con que un agente "verifica" sus propias ediciones.
Da una falsa sensación de cobertura. Conviven con tests de comportamiento genuinos.
[FUERTE] Field-guessing contra la propia API. empleados_dashboard.jsx:41-51 prueba 10 alternativas, incluida
usuario?._id. Hay 34 ._id en total, y qrReserva.js incluye "confirmed" en inglés. Prudente: el BE lo hacen ellos, así
que conocen el contrato. La "adivinanza" es lo que genera un modelo que no ve la respuesta real. Puede haber una
explicación inocente parcial (el BE cambió nombres durante el desarrollo), pero nadie podó las ramas que nunca matchean.
[LEVE→FUERTE] reservaRepository.js:25-92. Está en estilo minificado (52 líneas de Android Studio, commit 7c50060
"nueva modalidad hecha… morbo tha king"). Encima, el único commit de Flor (8d14864, +681 líneas) agrega FOR UPDATE OF
u, un comentario sobre READ COMMITTED, un test de concurrencia de 287 líneas y un documento de 161 líneas. Si Flor lo
explica, es el punto más fuerte del proyecto; si no, es el caso más claro de nivel desalineado con el curso.
[LEVE] Roles/middlewares, validatorHelper, AuthController, paneles FE, DB y scripts: ver el mapa. Se destacan los
tres alias de la ruta contraseña (iterar hasta que "ande"), el comentario {/* MODAL ARCHIVADOS (Se mantiene intacto)
*/} (gestion_usuarios.jsx:1144), App.jsx:64 "(Conexión corregida del perfil de empleado)" y el INTEGER NULLABLE en
una migración con estilo profesional (DO $$, NOT VALID).
[LEVE→FUERTE] Re-entrega del DDL (6dc8c20, "pedido polshu"). schema.sql:3 y database-schema-.txt:2 citan
database/README.md y ../database/schema.sql, rutas que nunca existieron en el repo: es compatible con archivos
generados por un agente (el repo tiene AGENTS.md, .agents/, opencode.json) en otro layout y movidos a docs/ sin
releerlos, y el "README de procedencia" prometido no está. El snapshot se capturó a las 12:16:51 UTC (09:16 ART, source-
permissions.json:2) y el commit es de las 09:45: en 29 minutos aparecen un extractor de catálogo con ACLs en JSON, un
seed con DO $$ … RAISE EXCEPTION y setval defensivo, y una cabecera "vista parcial histórica" sobre un archivo que es
idéntico en estructura al nuevo, lo que sugiere que nadie comparó los dos. Además, roles.sql dice smartlot/empleado
mientras el backend dice superadmin/cliente y el FE tiene un alias smartlot → superadmin y HISTORICAL_ROLE_IDS:
cada parte "resolvió" el desajuste por su cuenta en lugar de corregir la fuente. Y reset_password_invalidate_anteriores

existe en SQL sin uso, con la misma lógica reimplementada en JS con otra regla. Prudente: usar una herramienta para extraer
el catálogo es legítimo y el resultado ejecuta bien; lo que se evalúa en la defensa es si alguien puede explicar cómo se generó,
cuál es la fuente de verdad y por qué cita una carpeta inexistente.
Zonas genuinamente propias: la poda 9b7d8cc (con el matiz de que se llevó validators/), el fix documentado del orden
de rutas, sinContraseña consistente, las whitelists anti mass-assignment, 5dc85fd/0ca183e "fix a vulnerabilidades", los
tests de comportamiento, un historial con errores de tipeo e idas y vueltas humanas, y ADR-007 manual.
Atribución por integrante
Integrante Huella en git (sin skills ni lock) Qué preguntarle
"Android Studio" 42/58 BE, 29/60 FE: pagos MP, notificaciones, Primero, quién es. Hasta aclararlo, se pregunta a todo el
(máquina compartida) mailing, dbClient.js, poda 9b7d8cc, docs grupo.
70a3683
Franco-Cappella BE 7 / FE 13: deploy Render + SSL (62bbe18, rejectUnauthorized:false, ADR-007, qué paquete
8919346), recupero de contraseña, landing, skills era vulnerable, qué tests fallaban
de docs, ADR-007, paquete vulnerable (8e383ae),
22416a5 "fix de test que fallaban"
Tubia1 BE 3 / FE 13: QR de reservas, vista garagista qué contiene el QR y cómo se valida, qué testea
ModalQrReserva.source.test.js, de dónde sale
confirmed
Flor BE 1 commit (8d14864, +681): límite de reservas concurrencia, READ COMMITTED, cómo corre el test
con FOR UPDATE y test de concurrencia
FrancoUrquizo BE 3 / FE 5, cambios chicos en notificaciones cómo decide el BE qué notificaciones ve cada rol; ocultar
en la UI ≠ autorizar. Verificar participación real
(volumen bajo).
Augusto Traverso (= BE 2: solicitudes empresa-garage (cea56bf, flujo solicitud → trato, cómo generó el DDL, NOT
unknown +1148, con scripts probe-*/diagnose-*) y el VALID, para qué son los scripts
<augustraver@…>) DDL (86b9c11)
Preguntas de defensa oral
Ordenadas para una defensa de unos 20 minutos. Entre paréntesis, la respuesta esperada.
Bloque 0 — Atribución (1 min)
1. "¿Quién usa la máquina que commitea como 'Android Studio devandroid@ort'? ¿Qué partes del proyecto hizo cada
uno?" (Respuesta concreta por persona. Sin esto, la nota individual no se puede confirmar.)
Bloque 1 — Pagos y autorización (5 min; afecta Seguridad, Arquitectura BE y API) 2. "¿Quién puede llamar a POST
/api/payments/:paymentId/refund? Muéstrenme dónde se verifica que el pago sea de quien lo pide." (No se verifica. Solo
hace falta estar logueado y cualquiera se puede registrar. Esperado: reconocer autenticación ≠ autorización y proponer rol +
ownership.) 3. "En paymentController.js:384 dice 'usuario pidió permitir UUID'. ¿Quién es ese usuario y qué pidió?"
(Reconocer que es un resto de la conversación con la herramienta. Bonus: diferencia entre payment_id, preference_id y
merchant_order_id.) 4. "El admin paga una cuenta corriente: ¿quién decide el monto y qué consumos quedan saldados?
¿Qué pasa si el orderId empieza con ADMIN-PAGO-?" (Hoy lo decide el cliente, y el prefijo activa el tope de $0,10 aun en
producción. El servidor debería recalcular desde los consumos.) 5. "Recorran el flujo del empleado: paga, ¿cómo se entera el
back? ¿Qué verifica el webhook antes de confiar en el body?" (Firma HMAC con timingSafeEqual y después una consulta a
MP por el id.) 6. "savePaymentRecord recibe db. ¿Qué conexión usan las queries de las líneas 39 y 59? ¿Qué pasa si después
hay ROLLBACK?" (Usan pool, fuera de la transacción, así que el UPDATE queda aplicado igual.) 7. "¿Por qué
paymentController usa try/catch + next(err) y garageController no? ¿Qué pasa con un error async en cada uno en
Express 5?" (Express 5 propaga los rechazos al error handler: el try/catch sobra.)

Bloque 2 — Multi-tenant (2 min; Seguridad) 8. "Un admin de la empresa A, ¿puede dar de baja a un usuario de la
empresa B? ¿Y cancelar una reserva de B? ¿Dónde está el chequeo en updateAsync y por qué no está en
updateEstadoAsync?" (Hoy sí puede. La regla está en _aplicarReglasDeActualizacion y no se llama desde todos los
métodos.) 9. "¿Qué hace jwt.decode en el logout y en qué se diferencia de jwt.verify? ¿Puedo cerrarle la sesión a otro?"
(decode no verifica la firma, así que sí.)
Bloque 3 — Arquitectura y documentación (4 min; Arquitectura BE/FE y Estándares) 10. "¿Por qué hay dos archivos
que crean un Pool? El comentario de dbClient.js dice que mock.module falla con export default: abran garage-
responsables.test.js:4, ¿qué hace defaultExport?" (Hay dos pools en producción y el comentario es falso.) 11. "¿Dónde
se calcula el importe de una reserva al crearla y dónde se valida la disponibilidad al editarla? ¿Es la misma regla?" (Al crear, en
SQL dentro del repository; al editar, en JS en el service. Son dos implementaciones.) 12. "ADR-004 dice que la invalidación de
caché está centralizada en client.js. ¿Por qué API_Reserva.js y otros 14 servicios invalidan por su cuenta? ¿Cuál es la
verdad?" (Hay doble invalidación. Esperado: decir cuál dejarían.) 13. "¿Qué es un ADR y por qué los seis tienen la misma
fecha?" (Registra una decisión en el momento en que se toma, con sus alternativas. Acá se reconstruyeron después.) 14.
"Muéstrenme el token --success que describe DESIGN.md. Si les pido cambiar el azul de los paneles, ¿cuántos archivos
tocan?" (No existe. Son unos 65 archivos y cambiar el token solo repinta la landing.)
Bloque 4 — Frontend (3 min; Arquitectura FE y Componentes) 15. "¿Qué devuelve exactamente GET
/api/usuario/:id? ¿Cuál de las 10 ramas de obtenerIdUsuario se ejecuta de verdad? ¿Qué es _id?" (Solo id. _id es de
MongoDB y el resto de las ramas es código muerto.) 16. "Entren como superadmin a editar un garage y guarden. ¿Dónde
terminan? ¿Por qué el alta funciona y la edición no?" (Terminan en /unauthorized, porque editar_zona es una copia que
usa el header y las rutas de admin.) 17. "Después de pagar desde la pantalla de pagos del admin, ¿a qué URL vuelve
Mercado Pago? ¿Existe esa ruta?" (/admin/pagos no existe: la ruta es /admin_pagos.) 18. "¿Por qué borraron
validators/index.js en la limpieza en lugar de usarlo en los 7 formularios que repiten las regex?" (Esperado: distinguir
código muerto de abstracción no adoptada.)
Bloque 5 — Base de datos (4 min; BD, a Augusto y a quien haya hecho la re-entrega 6dc8c20) 19. "¿Cómo
generaron schema.sql? Si 'no es pg_dump directo', ¿qué query o herramienta usaron y dónde está, para poder
regenerarlo?" (Esperado: nombrar el procedimiento. Hoy no está versionado.) 20. "Los dos archivos de esquema remiten a
database/README.md y ../database/schema.sql. ¿Dónde está esa carpeta? ¿Por qué la citan si nunca existió en el repo?"
(No existe. Esperado: reconocer que el texto se escribió para otro layout y no se releyó.) 21. "Si clono el repo hoy, ¿qué
ejecuto y en qué orden? ¿Cuál es la fuente de verdad: schema.sql, el .txt o migrations/? ¿Las migraciones van después
de schema.sql? ¿Por qué 20260904_001_solicitud_modificacion.sql sigue con INTEGER NULLABLE?" (schema.sql →
roles.sql; las migraciones no reconstruyen la base y una no es sintaxis válida. El .txt es el mismo esquema sin tipos ni
funciones.) 22. "Con schema.sql + roles.sql, ¿funcionan los emails? ¿De dónde salen las filas de email_templates?" (No:
solo se siembran desde dos migraciones.) 23. "roles.sql dice que el rol 4 se llama smartlot y el 2 empleado. ¿Por qué el
backend busca 'superadmin' y 'cliente'? Si un superadmin modifica un trato, ¿qué dice la notificación que recibe el
dueño del garage?" (Las ramas por nombre nunca matchean; la notificación dice "admin" por el fallback ?? 'admin'.) 24.
"¿Para qué está la función reset_password_invalidate_anteriores si el repositorio hace el UPDATE a mano? ¿Cuál de las
dos reglas es la correcta, con o sin expires_at > NOW()?" 25. "¿Cómo sabe el sistema que un consumo está pagado? ¿Por
qué hay tres caminos y no una tabla pago_consumo?" (FK + jsonb + regex. Es una relación N:M que pide tabla puente.) 26.
"Ya tienen el enum estado_solicitud con pendiente/aceptada/rechazada/cancelada. ¿Por qué
solicitudes_registro.estado es text con esos mismos valores validados en JS?" 27. "¿Qué significa NOT VALID en un
constraint?" (Se crea sin validar las filas existentes y solo aplica a las nuevas.)
Bloque 6 — Concurrencia, QR y tests (2 min; a Flor y a Tubia1) 28. (A Flor) "¿Qué hace FOR UPDATE OF u y qué pasaría
si lo sacás y llegan dos reservas simultáneas del mismo empleado? ¿Por qué el comentario habla de READ COMMITTED?"
(Bloquea la fila del usuario hasta el fin de la transacción. Sin el bloqueo, ambas cuentan N activas e insertan. Con READ
COMMITTED, el SELECT posterior al lock ve lo confirmado.) 29. (A Tubia1) "¿Qué contiene el QR y cómo valida el back que
no está falsificado ni reutilizado? ¿El estado confirmed existe en el enum?" 30. "Si en Landing.jsx renombro locked a
bloqueado sin cambiar el comportamiento, ¿qué pasa con el test? ¿Y si meto un bug y la línea queda igual?" (Falla el primero
y pasa el segundo: el test no prueba comportamiento.)
Cierre (1 min) 31. "¿Qué decisión de diseño defenderían con más fuerza y cuál cambiarían hoy?"

6. Guía de corrección sugerida
Amerita re-entrega parcial. No por la calidad general, que es buena para el nivel, sino por tres motivos: hay un CRITICO y
tres ALTO de autorización en el módulo de dinero, el backend todavía no se puede levantar desde el repo sin conocimiento
externo (sin README ni .env.example; la base ya es reproducible tras 6dc8c20) y la nota individual no se puede confirmar
sin aclarar la autoría.
Prioridad 1 — Obligatorio para la re-entrega (seguridad e integridad)
1. Proteger con rol + ownership/tenant todas las rutas de /api/payments (refund, listado, webhook-events, GET por id),
y sacar las escrituras de los GET.
2. Hacer que el servidor calcule el monto de los pagos de admin a partir de los consumos, y que el "modo test" dependa
solo de configuración del servidor.
3. Aplicar el chequeo de tenant en todas las escrituras (sedes, estado/baja de usuarios, cancelar/liberar reservas,
ingreso/egreso sin reserva).
4. Logout con jwt.verify y límite de intentos en el código de recupero.
5. Entregar el esquema reproducible Cumplido en lo esencial con 6dc8c20 (schema.sql + roles.sql ejecutan
limpio). Pendiente: declarar una sola fuente de verdad (README con el orden de ejecución, sacar o regenerar el .txt
duplicado, decidir qué rol cumple migrations/), arreglar las referencias a database/, sembrar email_templates
desde el baseline y corregir la migración inválida (INTEGER NULLABLE). Alinear el vocabulario de roles del backend con
el seed.
6. Agregar el README y el .env.example del backend, limpiar la raíz y agregar INTEGRANTES.md aclarando "Android
Studio".
Prioridad 2 — Muy recomendable (corrección funcional) 7. Arreglar el bug transaccional de savePaymentRecord y
mover pagos a service + repository. 8. Que los repositories propaguen los errores en lugar de devolver null, que el error
handler deje de borrar cookies en los 500 y que los PUT dejen de pisar columnas. 9. Corregir la ruta de retorno de MP del
admin y editar_zona (header, rutas y uso de FormularioZona). 10. Calcular la capacidad del garage en el servidor y alinear
las validaciones que divergen (contraseña, teléfono, patente).
Prioridad 3 — Deuda de diseño (para trabajar, no exigible en la re-entrega) 11. Unificar la fábrica de errores, la capa
servicies/ y los helpers de vista, y fijar el contrato de respuesta en los servicios. 12. Descomponer los God services y
components según la sección 3, y unificar header y footer por rol. 13. Sistema de diseño: o se aplica a los paneles o se
corrigen los ADR. Un documento que afirma algo falso es peor que no tenerlo. 14. Reemplazar los tests source por tests de
comportamiento y sacar .agents//.claude/ del repo.
Para discutir en clase (errores comunes a varios grupos):
Autenticación ≠ autorización, y "si una operación tiene dueño, el chequeo va en todas las operaciones, no solo en
algunas". Este grupo es un caso de libro porque la regla existe y bien comentada en un método, y falta en el método
vecino.
El servidor es la fuente de verdad de todo lo que tiene consecuencia persistida o económica.
Documentación que se verifica contra el código. Pedirle a una herramienta que documente un sistema produce la
descripción del sistema ideal; el criterio está en contrastarla.
"Código muerto" vs "abstracción no adoptada": el caso de validators/ es excelente material didáctico.
Tests de comportamiento vs tests que leen el fuente.
Nota final propuesta: 5,7/10, sujeta a defensa oral (antes 5,6; la re-entrega del DDL ya subió Base de datos de 6 a 7). Si
la defensa muestra comprensión de pagos, concurrencia y caché, y la re-entrega cierra el resto de la Prioridad 1, es razonable
revisar Seguridad (5 → 7), con lo que la ponderada pasaría a 6,0. Si además declaran una única fuente de verdad del
esquema y alinean los roles con el seed, Base de datos podría llegar a 8 y la ponderada a unos 6,2.