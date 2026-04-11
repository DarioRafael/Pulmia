# Plan de Migración — Sistema IA Carcinoma Pulmonar

## 1. Resumen del código actual

### Qué hay hoy

La app es un chat médico de una sola pantalla. Flujo:

1. Usuario sube imagen en `InputBar` (drag/drop, paste, botón)
2. `ChatShell` llama `POST /api/chat` con el historial + imagen en base64
3. `route.ts` detecta imagen → llama FastAPI `/predict` → Groq interpreta → stream SSE de vuelta
4. Si no hay imagen, Groq responde usando `lastAnalysis` guardado en memoria de módulo
5. `useChat` gestiona el estado de mensajes + streaming
6. `MessageBubble` renderiza markdown y el Grad-CAM encima del texto

### Inventario de archivos

```
app/
  layout.tsx          — RootLayout, Inter font, sin providers
  page.tsx            — Renderiza <ChatShell /> directamente
  globals.css         — Variables CSS clínicas (deep slate + cobalt)
  api/chat/route.ts   — Lógica dual FastAPI + Groq, SSE streaming

components/
  chat/
    ChatShell.tsx       — Orquestador principal (estado + llamada API)
    InputBar.tsx        — Upload de imagen, base64, drag/drop
    MessageBubble.tsx   — Markdown + Grad-CAM, click-to-zoom
    MessageList.tsx     — Scroll container de mensajes
    TypingIndicator.tsx — Puntos animados de "pensando"
  layout/
    ChatSidebar.tsx     — Lista de sesiones (en memoria, sin persistencia)
    ChatItem.tsx        — Item individual de sesión
    Rail.tsx            — Barra de navegación izquierda
  ui/
    SearchBar.tsx       — Búsqueda Ctrl+F en DOM
    ThemeToggle.tsx     — Dark/light mode
    Toast.tsx           — Notificaciones

lib/
  api/chat.ts           — Parser SSE (onChunk, onGradcam, onDone, onError)
  hooks/
    useChat.ts          — Estado de mensajes + streaming (streamBuffer, attach gradcam)
    useTheme.ts         — Persistencia de tema en localStorage
  types/index.ts        — Message, Chat, Patient, StatusKey
  utils/markdown.ts     — Conversor básico MD → HTML
```

### Dependencias del entorno

```env
FASTAPI_URL   # URL modelo de visión (http://localhost:8000)
AI_API_URL    # Endpoint Groq
AI_API_KEY    # API key Groq
AI_MODEL      # Modelo Groq (ej: llama-3.3-70b-versatile)
```

---

## 2. Riesgos, dudas y decisiones tomadas

### ⚠️ Riesgos técnicos

**`lastAnalysis` como variable de módulo en `route.ts`**
Es un `let` a nivel de módulo, compartido entre *todas* las peticiones del mismo proceso Node.js.
En desarrollo single-user está bien. En producción multiusuario, usuario A vería el análisis de usuario B.
**Decisión**: dejarlo así hasta Fase 5 (Supabase), cuando se moverá a la tabla `estudios`.

**No hay autenticación**
`PlanProvider` necesita saber el plan del usuario, pero hoy no hay usuario.
**Decisión**: en Fase 1 el plan está hardcodeado como `'free'` vía prop. En Fase 4 se conectará a Supabase Auth.

### ❓ Dudas de negocio (resueltas con supuestos por ahora)

**¿Qué cuenta como "estudio"?**
Supuesto: cada imagen analizada por FastAPI es un estudio. Una conversación puede tener múltiples estudios si el usuario sube varias imágenes. Un estudio pertenece a un paciente (opcional en Free, requerido en Premium con gestión de pacientes).

**¿El historial de 3 estudios es por usuario o por paciente?**
Supuesto: por usuario en Free. Si cambia, solo hay que tocar `lib/plans/limites.ts`.

### 📐 Decisiones de arquitectura

**`lib/types/` vs `lib/tipos/`**
El código existente usa `lib/types/index.ts` (inglés). El target usa `lib/tipos/` (español, tipos de dominio nuevos).
**Decisión**: mantener `lib/types/` intacto en Fases 1-3. Crear `lib/tipos/` nuevo para tipos de dominio clínico (Estudio, Resultado, Paciente). En Fase 5 se consolida todo en `lib/tipos/` y se elimina `lib/types/`.

**`components/layout/` existente**
Tiene ChatSidebar, ChatItem, Rail. En Fase 2 se moverá a `features/chat-clinico/`. Por ahora queda intacto.

**No crear `app/(app)/layout.tsx` en Fase 1**
Se crea en Fase 3 cuando se activen las rutas del grupo `(app)`. Crear ahora un layout vacío podría interferir con el routing actual.

---

## 3. Plan de migración por fases

### ✅ Fase 1 (este PR): Infraestructura base — sin tocar el chat

**Objetivo**: toda la plomería de planes y feature-gating lista; el chat sigue funcionando igual.

**Crea:**
- `lib/plans/tipos.ts` — tipos TypeScript: PlanId, FeatureId, PlanDefinicion, LimitePlan
- `lib/plans/definicion.ts` — PLANES: Free (analizar, ver_estudio, chat_basico) y Premium (todo)
- `lib/plans/limites.ts` — LIMITES: Free (5/mes, 3 historial), Premium (ilimitado)
- `lib/plans/permisos.ts` — función `can(plan, feature): boolean`, fuente única de verdad
- `components/plan/PlanProvider.tsx` — Context + hook `usePlan()`, plan hardcodeado a 'free'
- `components/plan/FeatureGate.tsx` — `<FeatureGate feature="x">` con fallback a LockedCard
- `components/plan/LockedCard.tsx` — tarjeta con candado + link a /upgrade
- `components/plan/UpgradePrompt.tsx` — banner inline de upgrade
- `components/plan/index.ts` — re-exports
- Estructura de carpetas vacías con `.gitkeep` (ver lista abajo)

**Modifica:**
- `app/layout.tsx` — añade `<PlanProvider>` wrapeando `{children}`

**No toca:**
- Ningún archivo existente de chat, layout o lib (excepto app/layout.tsx)
- Ninguna ruta API

**Carpetas vacías creadas con `.gitkeep`:**
```
app/(auth)/login/
app/(auth)/registro/
app/(app)/dashboard/
app/(app)/analizar/
app/(app)/estudios/
app/(app)/estudios/[id]/
app/(app)/estudios/[id]/chat/
app/(app)/estudios/[id]/comparar/
app/(app)/pacientes/
app/(app)/pacientes/[id]/
app/(app)/pacientes/[id]/historial/
app/(app)/pacientes/[id]/editar/
app/(app)/reportes/
app/(app)/configuracion/
app/(app)/configuracion/plan/
app/(app)/configuracion/equipo/
app/(app)/upgrade/
app/api/analyze/
app/api/estudios/
app/api/estudios/[id]/
app/api/estudios/[id]/chat/
app/api/estudios/[id]/exportar/
app/api/pacientes/
app/api/webhooks/stripe/
features/analisis/components/
features/analisis/hooks/
features/estudios/components/
features/estudios/hooks/
features/chat-clinico/components/
features/chat-clinico/hooks/
features/pacientes/components/
features/pacientes/hooks/
features/reportes/components/
features/reportes/hooks/
features/comparacion/components/
features/comparacion/hooks/
features/auth/components/
features/auth/hooks/
lib/supabase/
lib/modelo/
lib/tipos/
```

---

### 🔜 Fase 2: Modularizar el chat en su feature

**Objetivo**: mover el código del chat a `features/chat-clinico/` sin cambiar el comportamiento.

**Mueve:**
- `components/chat/*.tsx` → `features/chat-clinico/components/`
- `components/layout/ChatSidebar.tsx`, `ChatItem.tsx`, `Rail.tsx` → `features/chat-clinico/components/`
- `lib/hooks/useChat.ts` → `features/chat-clinico/hooks/useChat.ts`
- `lib/api/chat.ts` → `features/chat-clinico/api.ts`
- Los tipos específicos del chat de `lib/types/index.ts` → `features/chat-clinico/tipos.ts`

**Actualiza:**
- `app/page.tsx` — actualiza el import de ChatShell
- Todos los imports internos dentro de la feature

**No toca:**
- `app/api/chat/route.ts` (se mueve en Fase 5)
- `lib/hooks/useTheme.ts`, `lib/utils/markdown.ts` — son utilidades compartidas, quedan en lib/

---

### 🔜 Fase 3: Rutas (app) y nueva pantalla de análisis

**Objetivo**: crear la estructura de rutas destino y convertir la pantalla principal en herramienta clínica.

**Crea:**
- `app/(app)/layout.tsx` — layout con sidebar plan-aware, header, PlanBadge
- `app/(app)/analizar/page.tsx` — nueva pantalla principal: subir imagen → ver informe
- `app/(app)/estudios/page.tsx` — historial de estudios (con FeatureGate para historial_ilimitado)
- `app/(app)/estudios/[id]/page.tsx` — vista de informe del estudio
- `app/(app)/estudios/[id]/chat/page.tsx` — chat clínico sobre el estudio (drawer o ruta)
- `app/(app)/upgrade/page.tsx` — página de planes
- `components/layout/Sidebar.tsx` — sidebar plan-aware (reemplaza Rail)
- `components/layout/PlanBadge.tsx` — badge Free/Premium en sidebar

**Modifica:**
- `app/page.tsx` — redirige a `/(app)/analizar`

---

### 🔜 Fase 4: Autenticación con Supabase

**Objetivo**: usuarios reales, planes reales desde la base de datos.

**Crea:**
- `lib/supabase/client.ts` — cliente browser
- `lib/supabase/server.ts` — cliente server (cookies)
- `lib/supabase/tipos.ts` — tipos generados de la DB
- `app/(auth)/login/page.tsx`
- `app/(auth)/registro/page.tsx`
- `features/auth/` — lógica de auth completa
- `middleware.ts` — protección de rutas (app) requiere auth

**Modifica:**
- `PlanProvider` — lee el plan del usuario desde Supabase en vez de hardcodeado
- `app/(app)/layout.tsx` — verifica sesión activa

---

### 🔜 Fase 5: Persistencia de estudios y modelo de datos

**Objetivo**: estudios guardados en Supabase, límites de plan aplicados.

**Crea:**
- `lib/tipos/estudio.ts`, `paciente.ts`, `resultado.ts`, `usuario.ts`
- `lib/modelo/client.ts` — cliente del modelo FastAPI con tipos estrictos
- `app/api/estudios/route.ts` — CRUD de estudios
- `app/api/estudios/[id]/route.ts`
- `app/api/analyze/route.ts` — reemplaza `/api/chat` para el análisis de imagen (crea estudio en DB)

**Modifica:**
- `app/api/chat/route.ts` — elimina `lastAnalysis` de módulo; pasa a leer de Supabase
- `features/analisis/` — conecta con nuevas APIs

**Tablas Supabase (esquema propuesto):**
```sql
usuarios    (id, email, plan, created_at)
estudios    (id, usuario_id, paciente_id?, imagen_url, created_at)
resultados  (id, estudio_id, cancer_probability, cancer_result, pathologies, gradcam_url)
pacientes   (id, usuario_id, nombre, fecha_nacimiento, notas)
```

---

### 🔜 Fase 6: Features premium activas

**Objetivo**: activar pacientes, reportes, comparación con validación en backend.

**Crea:**
- `features/pacientes/` completo
- `features/reportes/` — generación PDF server-side
- `features/comparacion/` — comparación side-by-side de estudios
- `app/api/estudios/[id]/exportar/route.ts` — con validación de plan en backend
- `app/api/pacientes/route.ts` — con validación de plan en backend
- `app/api/webhooks/stripe/route.ts` — actualiza plan en Supabase

**Principio**: las rutas API premium comprueban `can(user.plan, feature)` server-side y devuelven 403 si no tiene acceso. La UI muestra LockedCard pero un usuario malicioso tampoco puede acceder desde la API.

---

## 4. Estado al finalizar Fase 1

La app se ve y funciona exactamente igual que antes. Lo único que cambia:

- `app/layout.tsx` envuelve `{children}` con `<PlanProvider plan="free">`
- Existen `lib/plans/` y `components/plan/` listos para usar
- La estructura de carpetas del destino existe (vacía)
- Se puede usar `<FeatureGate>` y `can()` en cualquier componente nuevo

Para verificar que nada se rompió: cargar la app, subir una radiografía, verificar que el análisis y el chat siguen funcionando.
