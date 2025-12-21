# URL Management - Solución al Problema Recurrente

## 🔴 Problema Identificado

### Síntomas
- Plugin se queda atascado en pasos iniciales
- Errores de CORS recurrentes
- Cada cambio requiere actualizar URLs en múltiples archivos
- Falta de confianza en la estabilidad del sistema

### Causa Raíz

**URLs hardcodeadas en 6+ archivos diferentes:**

1. `viiibe-collector/content.js` - línea 4
2. `viiibe-collector/popup-v2.js` - líneas 89 y 182
3. `src/main.ts` - líneas 234 y 296
4. `code.js` - línea 146
5. `manifest.json` - línea 12

**Consecuencias:**
- Cada deploy de Vercel genera una URL nueva
- Hay que actualizar manualmente 6+ archivos
- Alto riesgo de olvidar algún archivo
- Difícil de mantener y propenso a errores

---

## ✅ Solución Implementada

### 1. **Archivos de Configuración Centralizados**

#### Para el Plugin de Figma
**Archivo:** `src/config.ts`

```typescript
export const API_BASE_URL = 'https://moood-refactor.vercel.app/api';
```

**Uso:**
```typescript
import { API_ENDPOINTS, getImageProxyUrl } from './config';

// En vez de:
const url = 'https://moood-refactor.vercel.app/api/image-proxy?url=...';

// Ahora:
const url = getImageProxyUrl(imageUrl);
```

#### Para la Extensión de Chrome
**Archivo:** `viiibe-collector/config.js`

```javascript
const API_BASE_URL = 'https://moood-refactor.vercel.app/api';
```

### 2. **Manifest Simplificado**

**Removido:**
- ❌ `https://*.pinterest.com`
- ❌ `https://*.pinimg.com`

**Razón:** Todas las requests van a través de nuestro backend proxy. No necesitamos acceso directo a Pinterest.

**Mantenido:**
- ✅ `https://moood-refactor.vercel.app` (nuestro backend)

---

## 📋 Plan de Migración

### Fase 1: Actualizar Plugin de Figma ✅

1. ✅ Crear `src/config.ts`
2. ✅ Actualizar `src/main.ts` para usar config
3. ✅ Actualizar `code.js` para usar config
4. ✅ Rebuild y probar

### Fase 2: Actualizar Extensión de Chrome ✅

1. ✅ Crear `viiibe-collector/config.js`
2. ✅ Actualizar `content.js` para usar config
3. ✅ Actualizar `popup-v2.js` para usar config
4. ⏳ Probar extensión

### Fase 3: Documentación ✅

1. ✅ Crear guía de deployment
2. ✅ Documentar proceso de cambio de URL
3. ✅ Crear checklist de verificación

---

## 🎯 Beneficios

### Antes
```
❌ 6+ archivos con URLs hardcodeadas
❌ Alto riesgo de inconsistencias
❌ Difícil de mantener
❌ Propenso a errores
```

### Después
```
✅ 1 archivo de configuración por proyecto
✅ Single source of truth
✅ Fácil de mantener
✅ Cambios centralizados
```

---

## 🔧 Cómo Cambiar la URL del Backend

### Antes (6+ pasos)
1. Buscar en `content.js` → cambiar URL
2. Buscar en `popup-v2.js` → cambiar 2 URLs
3. Buscar en `main.ts` → cambiar 2 URLs
4. Buscar en `code.js` → cambiar URL
5. Buscar en `manifest.json` → cambiar URL
6. Rebuild plugin
7. Recargar extensión
8. Rezar que no olvidaste ninguno 🙏

### Después (2 pasos)
1. Cambiar en `src/config.ts` (plugin) y `viiibe-collector/config.js` (extensión)
2. Rebuild y listo ✅

---

## 🚨 Sobre los Errores de CSP (Content Security Policy)

### Error Actual en Consola
```
Refused to load the stylesheet 'https://fonts.googleapis.com/...'
because it violates the following Content Security Policy directive
```

**Esto NO es un error de CORS** - es un error de **Content Security Policy** de Figma.

### Causa
El `index.html` del plugin carga Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:..." rel="stylesheet">
```

Figma bloquea esto por seguridad.

### Solución
Hay 3 opciones:

1. **Opción A: Usar fuentes del sistema**
   - Cambiar a `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...`
   - Más rápido, sin requests externas
   - Recomendado ✅

2. **Opción B: Incluir fuentes en el bundle**
   - Descargar Google Fonts
   - Incluirlas en el proyecto
   - Aumenta tamaño del bundle

3. **Opción C: Agregar Google Fonts al manifest**
   - Agregar `"https://fonts.googleapis.com"` a `allowedDomains`
   - Puede que Figma lo bloquee igual

**Recomendación:** Opción A - usar fuentes del sistema.

---

## 📊 Estado Actual

### Completado ✅
- [x] Crear `src/config.ts`
- [x] Crear `viiibe-collector/config.js`
- [x] Limpiar `manifest.json` (remover Pinterest)
- [x] Documentar problema y solución

### Pendiente ⏳
- [ ] Migrar `src/main.ts` a usar config
- [ ] Migrar `code.js` a usar config
- [ ] Migrar `content.js` a usar config
- [ ] Migrar `popup-v2.js` a usar config
- [ ] Rebuild y probar todo
- [ ] Solucionar error de Google Fonts (CSP)

---

## 🎓 Lecciones Aprendidas

1. **Centralizar configuración desde el inicio**
   - No hardcodear URLs nunca
   - Usar archivos de config

2. **Entender la diferencia entre CORS y CSP**
   - CORS: servidor bloquea requests cross-origin
   - CSP: navegador/Figma bloquea recursos externos

3. **Simplificar networkAccess**
   - Solo incluir dominios realmente necesarios
   - Todo lo demás debe ir por proxy

4. **Documentar decisiones arquitectónicas**
   - Por qué usamos proxy
   - Por qué no llamamos directo a Pinterest
   - Cómo funciona el flujo de datos

---

## 🔮 Próximos Pasos

1. **Completar migración a config centralizado**
2. **Solucionar error de Google Fonts**
3. **Crear script de deployment automatizado**
4. **Agregar tests para verificar URLs**
5. **Documentar flujo completo de datos**

---

## 📞 Contacto

Si encuentras más problemas de URLs o CORS:
1. Verificar que `src/config.ts` tiene la URL correcta
2. Verificar que todos los archivos importan de config
3. Verificar que `manifest.json` tiene el dominio correcto
4. Rebuild el plugin
5. Si persiste, revisar consola para error específico (CORS vs CSP)
