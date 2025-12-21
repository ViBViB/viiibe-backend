# Viiibe! Plugin - Technical Documentation

> **Última actualización**: 7 de Diciembre de 2025  
> **Versión**: 1.0-stable  
> **Estado**: ✅ Producción (AI Co-Pilot Ready)

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Flujo de Datos](#flujo-de-datos)
5. [API Endpoints](#api-endpoints)
6. [Variables de Entorno](#variables-de-entorno)
7. [Estructura de Datos en KV](#estructura-de-datos-en-kv)
8. [Funcionalidades Actuales](#funcionalidades-actuales)
9. [Limitaciones Conocidas](#limitaciones-conocidas)
10. [Guía de Troubleshooting](#guía-de-troubleshooting)
11. [Historial de Cambios](#historial-de-cambios)

---

## 📝 Descripción General

**Viiibe!** es un plugin de Figma que permite a los diseñadores:

1. **Guardar pins de Pinterest** vía extensión de Chrome
2. **Buscar pins guardados** usando lenguaje natural (NLP)
3. **Generar style guides automáticos** con:
   - Mood board (collage de imágenes)
   - Color palette (con variables de Figma vinculadas)
   - Type scale (escala tipográfica con Text Styles)

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Plugin UI | TypeScript + Vite |
| Plugin Backend | JavaScript (Figma API) |
| API Backend | Vercel Serverless Functions |
| Base de Datos | Vercel KV (Redis) |
| AI Analysis | Google Vision + OpenAI GPT-4o |
| Extensión Chrome | Vanilla JavaScript |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIGMA PLUGIN                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐  │
│  │   index.html  │────>│   main.ts     │────>│    code.js    │  │
│  │   (UI Layer)  │<────│   (Bridge)    │<────│   (Backend)   │  │
│  └───────────────┘     └───────────────┘     └───────────────┘  │
│                              │                      │            │
└──────────────────────────────│──────────────────────│────────────┘
                               │                      │
                               ▼                      ▼
                    ┌─────────────────────────────────────┐
                    │        VERCEL BACKEND               │
                    │  viiibe-backend-5f2375rar-...      │
                    ├─────────────────────────────────────┤
                    │  /api/get-saved-pins  (GET)        │
                    │  /api/save-pin        (POST)       │
                    │  /api/pin-analysis    (POST)       │
                    │  /api/image-proxy     (GET)        │
                    │  /api/curated-boards  (GET)        │
                    └────────────────│────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │           VERCEL KV                 │
                    ├─────────────────────────────────────┤
                    │  saved-pin:{id}     - Pin data     │
                    │  pin-tags:{id}      - AI analysis  │
                    │  category:{name}    - Category set │
                    └─────────────────────────────────────┘
```

---

## ✅ Funcionalidades Actuales

### ✅ Funcionando Completamente

- [x] Guardar pins desde Pinterest (extensión Chrome)
- [x] Análisis AI de imágenes (colores, estilos, industria)
- [x] Búsqueda NLP de pins guardados
- [x] Filtro por color usando AI analysis + Visual Filter
- [x] Generación de Mood board
- [x] Generación de Color palette con **variables Figma vinculadas**
- [x] Generación de Type scale con **Text Styles vinculados**
- [x] **21 Text Styles** creados automáticamente (Display, Heading, Body, Label)
- [x] **44 Color Variables** creadas en colección Viiibe Primitives
- [x] Proxy de imágenes para evitar CORS
- [x] Lightbox con imágenes en resolución original
- [x] Orden de páginas correcto (Mood board primero)

### ⚠️ Limitaciones

- [ ] Variables de tamaño (size primitives) - Deshabilitado por memoria
- [ ] Variables de tipografía (font family/weight) - Deshabilitado por memoria
- [ ] Vinculación de fills a variables - Funciona pero no con setBoundVariable directo

---

## 🎨 Colores Soportados en Búsqueda

| Color | Keywords | Visual Filter |
|-------|----------|---------------|
| red | red, rojo, crimson, scarlet | Hue 345-15 |
| blue | blue, azul, navy, cobalt | Hue 190-260 |
| cyan | cyan, turquoise, teal, aqua | Hue 160-190 |
| green | green, verde, emerald, forest | Hue 70-160 |
| lime | lime, lime green, bright green | Hue 60-100 |
| yellow | yellow, amarillo, gold | Hue 40-70 |
| orange | orange, naranja, tangerine | Hue 15-40 |
| purple | purple, morado, violet | Hue 260-300 |
| pink | pink, rosa, magenta, fuchsia | Hue 300-345 |
| black | black, negro, dark | Lightness ≤25 |
| white | white, blanco, light | Lightness ≥80 |
| gray | gray, grey, gris, silver | Saturation ≤15 |
| beige | beige, cream, ivory, sand | Warm, low sat, light |
| brown | brown, marrón, tan, chocolate | Warm, dark |
| colorful | colorful, multicolor, rainbow | Saturation ≥35 |

---

## 📊 Estadísticas de Contenido

| Métrica | Valor |
|---------|-------|
| Pins totales en KV | 284 |
| Pins con AI analysis | 284 (100% coverage) |
| Curation model | AI Co-Pilot assisted |
| Target collection (Month 8) | 16,000 designs |
| Daily curation rate | 100 designs/day |
| Cost per design | $0.39 (with AI) |

### AI Co-Pilot Curation Model:
- 1 curator + AI assistance
- $772/month operating cost
- Legal, scalable, high-quality
- Balanced color distribution maintained by AI

---

## 📜 Historial de Cambios

### 6 de Diciembre 2025 (v1.1.0)

#### ✅ Text Styles Restaurados
- Reactivados 21 Text Styles que estaban deshabilitados
- Simplificada función `createTypographyStyles()` para usar valores directos
- Eliminado `setBoundVariable` problemático que causaba memory errors
- Estilos creados: Display (6), Heading (5), Body (5), Label (5)

#### ✅ Color Variables Vinculadas a Paleta
- Rectángulos en Color Palette ahora vinculados a variables de color
- Usa `figma.variables.setBoundVariableForPaint()` correctamente
- 44 variables de color vinculadas automáticamente

#### ✅ Orden de Páginas Corregido
- Mood board ahora aparece primero en la lista de páginas
- Navegación automática a Mood board después de generar

#### ✅ Búsqueda de Colores Expandida
- Agregados colores faltantes a NLP_KEYWORDS: beige, cyan, lime, colorful
- COLOR_RANGES expandido en palette.ts para visual filtering
- Pink range expandido de 310-330 a 300-345
- Colorful threshold reducido de 50 a 35

#### ✅ Optimización de Variables
- `createPrimitivesCollection()` optimizado para evitar memory errors
- Variables existentes se obtienen una sola vez antes del loop
- Reducido de 44 llamadas async a 1

#### ✅ Lightbox en Full Resolution  
- Imágenes del lightbox ahora usan `/originals/` en lugar de `/736x/`
- Aplica a: click inicial, navegación prev/next, post-delete

#### 🐛 Bugs Corregidos
- Fixed: Plugin crasheaba al buscar "pink" o "colorful"
- Fixed: Beige, brown, lime mostraban 0 resultados
- Fixed: Visual filter eliminaba todos los pins para colores nuevos

### 5 de Diciembre 2025 (v1.0.0)

- OAuth Removido
- Errores de Sintaxis Figma corregidos
- Errores de Memoria WebAssembly mitigados
- Análisis AI batch ejecutado para 165 pins
- Filtro de Color actualizado para usar aiAnalysis
- CORS/Proxy implementado
- Búsqueda NLP actualizada

---

## 🚀 Comandos Útiles

```bash
# Build del Plugin
npm run build

# Deploy a Vercel
vercel --prod

# Consultar pins por color
curl "https://viiibe-backend-5f2375rar.../api/get-saved-pins" | jq -r '.pins[].aiAnalysis.color[]' | sort | uniq -c | sort -rn
```

---

*Documento actualizado: 6 de Diciembre 2025*

