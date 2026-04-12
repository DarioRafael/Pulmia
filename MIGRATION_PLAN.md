# Plan de Migración — Sistema IA Carcinoma Pulmonar

## Estado actual: Fase 1 COMPLETA ✅

La app fue reestructurada de chat-first a herramienta clínica. El chat ahora es
una burbuja flotante tipo Messenger disponible en toda la app.

---

## Arquitectura implementada

```
app/
├── layout.tsx                    ← RootLayout con PlanProvider
├── page.tsx                      ← redirect → /analizar
├── globals.css
├── (app)/
│   ├── layout.tsx                ← SidebarApp + ChatBubble flotante
│   ├── analizar/page.tsx         ← ⭐ Pantalla principal (subir → informe)
│   ├── dashboard/page.tsx        ← Resumen + estudios recientes
│   ├── estudios/
│   │   ├── page.tsx              ← Historial de estudios (con límites)
│   │   └── [id]/
│   │       ├── page.tsx          ← Vista detallada de un estudio
│   │       └── chat/page.tsx     ← Chat expandido sobre estudio
│   ├── configuracion/page.tsx    ← Info del plan + ajustes
│   └── upgrade/page.tsx          ← Comparación Free vs Premium
├── (auth)/                       ← Pendiente (login/registro)
└── api/
    ├── analyze/route.ts          ← NUEVO: imagen → FastAPI → InformeAnalisis
    └── chat/route.ts             ← Refactorizado: usa lib/modelo + estado compartido

features/
├── analisis/                     ← ZonaSubida, InformeResultado, useAnalisis
├── estudios/                     ← ListaEstudios, useEstudios (localStorage)
├── chat-clinico/                 ← ChatBubble, ChatView, BarraInput, streaming
├── pacientes/                    ← Pendiente (Premium)
├── reportes/                     ← Pendiente (Premium)
├── comparacion/                  ← Pendiente (Premium)
└── auth/                         ← Pendiente

components/
├── layout/
│   ├── sidebar-app.tsx           ← Navegación con candados en features premium
│   ├── header-app.tsx            ← Header de sección con toggle tema
│   └── plan-badge.tsx            ← Badge Free/Premium en sidebar
├── plan/
│   ├── plan-provider.tsx         ← Context + usePlan()
│   ├── feature-gate.tsx          ← <FeatureGate feature="x">
│   ├── locked-card.tsx           ← Tarjeta con candado → /upgrade
│   ├── upgrade-prompt.tsx        ← Banner inline de upgrade
│   └── index.ts
└── ui/
    └── Toast.tsx                 ← Notificaciones (mantenido)

lib/
├── plans/                        ← ⭐ FUENTE ÚNICA DE VERDAD
│   ├── tipos.ts                  ← PlanId, FeatureId, PlanDefinicion, LimitesPlan
│   ├── definicion.ts             ← PLANES: Free + Premium
│   ├── limites.ts                ← LIMITES: 5/mes, 3 historial (Free)
│   ├── permisos.ts               ← can(plan, feature) — ÚNICA función de decisión
│   └── index.ts
├── tipos/                        ← Tipos de dominio
│   ├── resultado.ts              ← ResultadoAnalisis, InformeAnalisis, Severidad
│   ├── estudio.ts                ← Estudio, EstudioNuevo
│   ├── paciente.ts               ← Paciente (Premium)
│   ├── usuario.ts                ← Usuario (para Supabase Auth)
│   └── index.ts
├── modelo/                       ← Cliente tipado de FastAPI
│   ├── client.ts                 ← predecirRadiografia() con ModeloError
│   ├── tipos.ts                  ← FastAPIPredictResponse (DTO crudo)
│   └── index.ts
├── servidor/
│   └── estado-analisis.ts        ← Estado en memoria del último análisis
├── utils/
│   ├── umbrales.ts               ← UMBRAL_PATOLOGIA, UMBRAL_YOUDEN, ETIQUETAS_CARCINOMA
│   ├── formato.ts                ← aInforme(), aPorcentaje(), calcularSeveridad()
│   ├── fechas.ts                 ← formatearFecha(), ahoraISO()
│   └── index.ts
├── hooks/
│   └── useTheme.ts               ← Persistencia dark/light (mantenido)
└── supabase/                     ← Pendiente
```

---

## Principios implementados

1. **`can(plan, feature)` es la única función de permisos** — ningún componente compara strings
2. **`<FeatureGate feature="x">` envuelve UI premium** — cero `if` regados
3. **Features premium se muestran bloqueadas con 🔒** — click → /upgrade
4. **Cada feature es autocontenida** en `features/` — components, hooks, api, tipos juntos
5. **Rutas API usan módulos compartidos** — `lib/modelo`, `lib/servidor/estado-analisis`
6. **Chat es una burbuja flotante** — disponible en toda la app sin ser el protagonista

---

## Fases pendientes

### Fase 2: Autenticación con Supabase
- `lib/supabase/client.ts`, `server.ts`, `tipos.ts`
- `app/(auth)/login/page.tsx`, `app/(auth)/registro/page.tsx`
- `features/auth/` completo
- `middleware.ts` para protección de rutas
- `PlanProvider` lee el plan del usuario desde Supabase

### Fase 3: Persistencia de estudios
- Migrar `useEstudios` de localStorage a Supabase
- `app/api/estudios/` CRUD
- Subir imágenes a Supabase Storage
- Eliminar `lastAnalysis` de módulo → leer de DB

### Fase 4: Features premium activas
- `features/pacientes/` completo
- `features/reportes/` — generación PDF server-side
- `features/comparacion/` — comparación side-by-side
- `app/api/estudios/[id]/exportar/route.ts` — con validación plan en backend
- `app/api/pacientes/route.ts` — con validación plan en backend

### Fase 5: Pagos con Stripe
- `app/api/webhooks/stripe/route.ts`
- Integración Stripe Checkout
- Actualización automática de plan en Supabase
