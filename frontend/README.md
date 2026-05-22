# VetCare — Frontend

React + TypeScript + Vite. Monorepo VetCare System (ADR-003: REST + JWT).

## Estructura

```
src/
├── pages/          # Pantallas
├── components/     # UI, layout (Sidebar, AppLayout)
├── services/       # Cliente API (fetch + JWT)
├── hooks/          # useTheme (dark mode)
├── context/        # AuthContext, NotificationContext
├── types/          # TypeScript
├── utils/          # jwt, authErrors, photo
└── App.tsx         # Rutas
```

## Inicio rápido

Desde la raíz del monorepo:

```bash
npm run install:auth
npm run dev
```

Debes ver **7 procesos**: `api`, `pets`, `rem`, `storage`, `query`, `notif`, `web`.

Abre http://localhost:3000

## Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@vetcare.co | admin123 |
| Veterinario | demo@vetcare.co | demo123 |
| Dueño | dueno@vetcare.co | dueno123 |

## Módulos implementados

| Módulo | Ruta |
|--------|------|
| Dashboard global | `/inicio` |
| Dashboard por mascota | `/mascotas/:id` (query-visualization `/dashboard/{petId}`) |
| Mascotas CRUD (vet/admin) | `/mascotas`, `/mascotas/nueva` |
| Info complementaria dueño | `/mascotas/:id` — hábitos, alimentación, síntomas |
| Historial clínico | `/mascotas/:id/historial` |
| Recordatorios | `/recordatorios` — crear (vet), confirmar (dueño) |
| Notificaciones multicanal | Campana (IN_APP, EMAIL, PUSH) |
| API / OpenAPI | `/api-docs` |
| Panel admin (completo) | `/admin` — usuarios, seguridad, notificaciones, observabilidad |
| Panel veterinario | `/panel/veterinario` |
| Panel dueño | `/panel/dueno` |
| Perfil | `/perfil` — dueño: mascotas, accesos rápidos y aviso de notificaciones |
| Auth | `/login`, `/registro`, `/recuperar-contrasena` |

### Demo veterinario (`demo@vetcare.co`)

1. **Panel veterinario** → alertas, controles vencidos y acciones rápidas (+ Nueva consulta).
2. **Mascotas → Luna** → Historial / + Consulta desde la tarjeta o detalle.
3. **Historial → + Nueva consulta** → vacunas/seguimiento generan recordatorios automáticos.
4. **Recordatorios** → filtrar por mascota, marcar completado; ver si el dueño confirmó asistencia.
5. **Dashboard analítico** (`/inicio`) → gráficos y vista global.
6. **Campana 🔔** → notificación IN_APP (control Luna vencido).

### Demo dueño (`dueno@vetcare.co`)

1. **Panel dueño** → mascotas, recordatorios, confirmar asistencia.
2. **Mascotas → Luna → Info complementaria** (`#notas-dueno`) → hábitos, alimentación, síntomas.
3. **Historial clínico** → solo lectura.
4. **Campana 🔔** → notificaciones IN_APP / EMAIL / PUSH (demo).
5. Tras **Confirmar asistencia**, se muestra fecha de confirmación.

### Panel administrador (`/admin`)

- **Usuarios:** CRUD, activar/desactivar, bloquear, roles (Vet / Dueño / Admin)
- **Seguridad:** intentos fallidos de login, forzar cierre de sesión
- **Notificaciones:** envío global por rol + historial (enviado / error)
- **Observabilidad:** logs, errores, estado microservicios (online/offline, healthy/unhealthy)
- **Sistema:** arquitectura ADR-001, métricas (usuarios, mascotas, consultas)

## Funcionalidades técnicas

- **API:** `fetch` con JWT, retry en 5xx, mensajes HTTP 400/401/403/404/500
- **Estado global:** Context API (auth, token, roles, notificaciones, toasts)
- **UX:** Sidebar responsive, dark mode, skeletons, modales, estados vacíos, toasts
- **Microservicios consumidos:** user-management, clinical-history, tracking-reminders, query-visualization, notification-service
- **Alineado al PDF:** RBAC por rol, recordatorios automáticos al registrar consulta (vacunas/seguimiento), notificaciones demo precargadas, contratos OpenAPI enlazados

## Variables de entorno

Opcional `.env`:

```
VITE_API_URL=
```

En desarrollo el proxy de Vite enruta `/api/v1/*` a cada puerto.
