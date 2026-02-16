# ✅ Webhook Ya Configurado - Verificación Necesaria

## 🎉 Buenas Noticias

El webhook **YA está configurado** en Vercel:
```
✅ STRIPE_WEBHOOK_SECRET - Configurado hace 1 día
✅ STRIPE_SECRET_KEY - Configurado hace 1 día
```

## 🔍 Problema Actual

El webhook **no se disparó** durante tu último pago de prueba. Esto puede ser porque:

1. El webhook está configurado para **modo LIVE** pero estás pagando en **modo TEST**
2. El webhook está **deshabilitado** en Stripe
3. El webhook tiene **errores** de entrega

---

## 📋 Pasos de Verificación

### Paso 1: Acceder a Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/webhooks
2. Inicia sesión con tu cuenta de Stripe
3. **IMPORTANTE**: Verifica que estés en el **modo correcto**
   - Arriba a la derecha verás: "Test mode" o "Live mode"
   - Para pagos de prueba, debe estar en **"Test mode"** ✅

### Paso 2: Verificar el Webhook

Busca un webhook con esta URL:
```
https://viiibe-backend.vercel.app/api/stripe-webhook
```

**Deberías ver**:
- ✅ Estado: "Enabled" (habilitado)
- ✅ Eventos: `checkout.session.completed`
- ✅ Modo: Debe coincidir con el modo que estás usando para pagos

### Paso 3: Revisar Eventos Recientes

1. **Click en el webhook** que encontraste
2. Ve a la pestaña **"Recent events"**
3. **Busca eventos de los últimos 10 minutos**

**Qué esperar**:

#### ✅ Si el webhook está funcionando:
Verás eventos con:
- Tipo: `checkout.session.completed`
- Timestamp: Hace pocos minutos
- Estado: ✅ (checkmark verde)
- Response: `200 OK`

#### ❌ Si el webhook NO está funcionando:
Verás uno de estos escenarios:

**Escenario A: No hay eventos recientes**
- Significa: El webhook no está recibiendo eventos de Stripe
- Causa probable: Modo incorrecto (Test vs Live)

**Escenario B: Eventos con errores (❌ rojo)**
- Click en el evento fallido
- Verás el error específico
- Causas comunes:
  - `401 Unauthorized` → Secret incorrecto
  - `500 Internal Error` → Error en el código del webhook
  - `Timeout` → Webhook muy lento

---

## 🔧 Soluciones Según el Problema

### Problema 1: Modo Incorrecto

**Síntoma**: No hay eventos recientes en el webhook

**Solución**:
1. Verifica que estés en **Test mode** en Stripe
2. Verifica que el webhook esté en **Test mode**
3. Si el webhook está en Live mode:
   - Crea un nuevo webhook para Test mode
   - O cambia el webhook existente a Test mode

### Problema 2: Webhook Deshabilitado

**Síntoma**: Webhook muestra "Disabled"

**Solución**:
1. Click en el webhook
2. Click en "Enable endpoint"
3. Confirma

### Problema 3: Errores de Entrega

**Síntoma**: Eventos con ❌ rojo

**Solución según el error**:

**401 Unauthorized**:
```bash
# El secret está mal, necesitas actualizarlo
# 1. En Stripe, revela el signing secret del webhook
# 2. Copia el secret (empieza con whsec_...)
# 3. Actualiza en Vercel:
vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# Pega el nuevo secret cuando te lo pida
# 4. Redeploy:
vercel --prod
```

**500 Internal Error**:
```bash
# Hay un error en el código del webhook
# Revisa los logs de Vercel:
vercel logs viiibe-backend --prod --since 1h
```

---

## 🧪 Probar el Webhook

### Opción 1: Enviar Evento de Prueba

1. En Stripe Dashboard → Tu webhook
2. Click en **"Send test webhook"**
3. Selecciona: `checkout.session.completed`
4. Click en **"Send test webhook"**
5. Deberías ver: ✅ `200 OK`

### Opción 2: Hacer un Pago Real de Prueba

1. Reset tu cuenta a FREE
2. Haz un nuevo pago de prueba
3. Inmediatamente ve a Stripe → Webhooks → Recent events
4. Deberías ver el evento aparecer en tiempo real
5. Debería mostrar ✅ `200 OK`

---

## 📊 Checklist de Verificación

Completa esto mientras revisas Stripe:

- [ ] Estoy en **Test mode** en Stripe Dashboard
- [ ] Existe un webhook con URL: `https://viiibe-backend.vercel.app/api/stripe-webhook`
- [ ] El webhook está **Enabled** (habilitado)
- [ ] El webhook escucha: `checkout.session.completed`
- [ ] El webhook está en **Test mode** (no Live mode)
- [ ] Hay eventos recientes (últimos 10 min)
- [ ] Los eventos muestran ✅ `200 OK`

---

## 🎯 Próximos Pasos

### Si TODO está bien en Stripe:

El problema puede ser que el webhook se configuró **después** de tu último pago. 

**Solución**: Haz un nuevo pago de prueba:
1. Reset a FREE
2. Haz 3 downloads
3. Paga de nuevo
4. Esta vez el webhook debería dispararse
5. Success page debería detectar PRO automáticamente

### Si encuentras problemas:

Toma screenshots de:
1. La lista de webhooks en Stripe
2. Los detalles del webhook (eventos, estado)
3. La pestaña "Recent events"
4. Cualquier error que veas

Y compártelos conmigo para ayudarte a arreglarlo.

---

## 💡 Nota Importante

El webhook solo se dispara cuando:
1. Un pago **se completa** en Stripe
2. El webhook está **habilitado**
3. El webhook está en el **modo correcto** (Test/Live)
4. El evento `checkout.session.completed` está **seleccionado**

Si todas estas condiciones se cumplen, el webhook debería funcionar perfectamente.

---

**¿Qué encontraste en Stripe Dashboard?** Compárteme lo que ves y te ayudo a diagnosticar! 🔍
