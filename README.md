# Muestras · KROMBYTE

Cinco tiendas independientes: Esmeraldas, Ivagos, QuéDetalle, Tapinta y D’globos. Cada presentación conserva su diseño y solo menciona su propio negocio. Las webs se publican en GitHub Pages y se conectan directamente a Supabase: no dependen del alojamiento anterior.

## Construir y publicar

`npm ci`, `npm run build`, `npm test`. El resultado está en `dist/`. GitHub Actions publica esta carpeta en Pages al actualizar `main`. La primera ejecución importa el paquete de código inicial al repositorio; después los archivos se editan directamente. Las acciones están fijadas por SHA y solo se ejecutan desde main o por solicitud manual.

Ruta pública: `/Muestras/ivagos/`. Panel: `/Muestras/ivagos/admin/`. Las otras empresas siguen la misma estructura. La raíz no lista otras muestras. El panel carga su interfaz en `/admin/app/`; todas las lecturas y escrituras privadas se autorizan en el servidor.

## Configuración

`cloud.json` contiene solamente URL y clave PUBLICABLE de Supabase; es intencional que sean públicas. Ninguna clave service_role, contraseña, token de activación ni consulta privada se guarda en GitHub. Las claves privadas de servicio pertenecen al entorno de Edge Functions administrado por Supabase.

La API está en `supabase/functions/muestras-api/`. Las migraciones versionadas crean el esquema. Para otro proyecto: aplicar migraciones, cargar los catálogos iniciales en `kb_shops`, configurar los hashes y caducidad de activación en la base privada, desplegar la función y actualizar cloud.json. Configurar el origen permitido y la dirección BASE en la función al cambiar de dominio. El código de la función verifica por sí mismo sesiones y permisos; verify_jwt está desactivado únicamente para permitir las rutas públicas de catálogo y consultas.

## Cuentas y rangos

Supabase Auth gestiona correo y contraseña. Una cuenta de Auth sin membresía no puede acceder a ningún panel. Los permisos se consultan en cada operación y siempre incluyen el negocio. Los rangos separan catálogo, lectura, seguimiento, contenido, visitas y equipo. Desactivar una membresía quita su acceso inmediatamente. Ninguna persona puede asignar permisos que no posee, modificar una cuenta superior ni retirar la última propietaria.

La primera propietaria usa un enlace privado de un solo uso que vence en siete días. El servidor conserva únicamente su hash. Puede crear cuentas y rangos desde Equipo. Cada persona cambia su contraseña en Mi cuenta. La recuperación genera un enlace privado desde Equipo, sin enviar correos automáticamente. No se configuraron Google ni biometría. Las sesiones se guardan por tienda en sessionStorage y se borran al cerrar la pestaña. Las operaciones privadas verifican la sesión activa en Supabase además de la identidad.

## Datos y privacidad

Todas las tablas tienen RLS y políticas de denegación al acceso directo del navegador. La API usa su clave de servicio solo en el servidor y filtra siempre por tienda. El comprobante público muestra únicamente estado, ID y fecha; nunca contactos o notas. Los datos existentes de catálogo, preguntas, consultas y visitas se migraron a Supabase. Las credenciales del sistema anterior requieren una activación nueva; no se exportaron hashes de contraseñas a este repositorio.

La bandeja se actualiza cada quince segundos mientras está visible. Las visitas son sesiones, no personas únicas ni ventas. Catálogo, precios e imágenes siguen siendo una propuesta pendiente de aprobación comercial. No confirma pedidos, cobra ni envía mensajes de WhatsApp.

## Pruebas

`npm test` verifica independencia de los negocios, rutas, sintaxis y ausencia del alojamiento anterior en los archivos publicados. `tests/live-api.mjs` es una prueba opcional con una fixture privada desechable: comprueba acceso, precios, consultas, idempotencia, seguimiento, recuperación, revocación y bloqueo entre tiendas. La fixture no está en GitHub. Los datos reales nunca son fixtures.

Los asesores de Supabase confirmaron las políticas de las tablas. La detección de contraseñas filtradas no está activada en Auth; consultar [seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se contrató ningún plan de pago; el proyecto conserva los límites y condiciones del servicio gratuito.
