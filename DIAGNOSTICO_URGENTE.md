# 🔍 DIAGNÓSTICO URGENTE - Payment No Detectado

## 🚨 Problema Actual

La página de éxito muestra:
```
"Verification taking longer than expected. Please refresh the plugin in a moment."
```

Y el plugin sigue pidiendo upgrade a PRO.

---

## 📋 Pasos para Diagnosticar

### Paso 1: Obtener tu User ID

1. **Abre el plugin en Figma**
2. **Abre Developer Tools** (Cmd+Option+I)
3. **Ve a la pestaña Console**
4. **Busca este log**:
   ```
   📨 Received figma-user-init: { userId: "391237238395566146", ... }
   ```
5. **Copia el userId** (el número largo)

### Paso 2: Usar la Herramienta de Debug

**Abre esta URL en tu navegador:**
```
https://viiibe-backend.vercel.app/debug-payment.html
```

1. Pega tu userId en el campo
2. Click en "Check Status"
3. **Toma screenshot** de los resultados
4. Compárteme el screenshot

---

## 🔍 Qué Revisar en los Resultados

### ✅ Si está funcionando correctamente:
```json
{
  "success": true,
  "isPro": true,  // ← Debe ser true
  "raw_data": {
    "is_pro": true,  // ← Debe ser true
    "payment_id": "cs_test_...",  // ← Debe existir
    "last_payment": "2026-02-09..."  // ← Debe tener fecha
  }
}
```

### ❌ Si NO está funcionando:
```json
{
  "success": true,
  "isPro": false,  // ← Problema: es false
  "raw_data": {
    "is_pro": false,  // ← No se actualizó
    "downloads_count": 3  // ← Sigue en FREE
  }
}
```

---

## 🐛 Posibles Causas y Soluciones

### Causa 1: Webhook de Stripe No Configurado

**Síntoma**: `payment_id` no existe en la base de datos

**Solución**:
1. Ve a: https://dashboard.stripe.com/webhooks
2. Verifica que exista un webhook apuntando a:
   ```
   https://viiibe-backend.vercel.app/api/stripe-webhook
   ```
3. Debe escuchar el evento: `checkout.session.completed`

### Causa 2: User ID No Coincide

**Síntoma**: Hay datos en la DB pero para otro userId

**Solución**:
1. Verifica que el userId del plugin sea el mismo que usaste en el pago
2. Revisa en la consola del plugin el userId exacto
3. Compara con el userId en la DB

### Causa 3: Webhook Falló

**Síntoma**: El webhook se ejecutó pero dio error

**Solución**:
1. Ve a Stripe Dashboard → Webhooks
2. Click en el webhook
3. Revisa los "Recent events"
4. Busca errores en rojo

---

## 🔧 Fix Rápido Manual

Si necesitas activar PRO manualmente mientras investigamos:

**Opción 1: Usar el endpoint de force-pro**
```bash
curl -X POST "https://viiibe-backend.vercel.app/api/force-pro-both?userId=TU_USER_ID"
```

**Opción 2: Usar la herramienta de reset**
```
https://viiibe-backend.vercel.app/reset-tool.html
```
1. Pega tu userId
2. Click en "Force PRO Status"

---

## 📊 Información que Necesito

Para ayudarte mejor, necesito:

1. **Tu userId de Figma** (del console log)
2. **Screenshot de la herramienta de debug** (https://viiibe-backend.vercel.app/debug-payment.html)
3. **¿Usaste tarjeta de test o real?**
4. **¿Cuánto tiempo pasó desde el pago?** (segundos/minutos)

---

## 🎯 Próximos Pasos

1. ✅ Obtén tu userId del plugin
2. ✅ Abre la herramienta de debug
3. ✅ Toma screenshot de los resultados
4. ✅ Compárteme la info

Con esa información podré ver exactamente qué está pasando y arreglarlo.

---

## 🚀 URLs Útiles

- **Debug Tool**: https://viiibe-backend.vercel.app/debug-payment.html
- **Reset Tool**: https://viiibe-backend.vercel.app/reset-tool.html
- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
- **Vercel Logs**: https://vercel.com/alberto-s-team/viiibe-backend

---

**Mientras tanto, puedes usar el fix manual (force-pro) para continuar trabajando.**
