# Landing Page Deployment Guide

## 🚀 Deploy to Vercel

La landing page de Viiibe! está configurada para desplegarse automáticamente en **moood.studio/viiibe**

### Configuración Actual

- **URL**: `https://moood.studio/viiibe`
- **Hosting**: Vercel
- **Ubicación**: `/public/landing/`

### Cómo Hacer Deploy

#### Opción 1: Deploy Automático (Recomendado)

1. Haz commit de tus cambios:
   ```bash
   git add .
   git commit -m "Update landing page"
   git push
   ```

2. Vercel detectará automáticamente los cambios y desplegará

#### Opción 2: Deploy Manual

```bash
vercel --prod
```

### Estructura de Archivos

```
public/
  └── landing/
      ├── index.html
      ├── style.css
      ├── script.js
      ├── how-it-works.css
      ├── how-it-works.js
      └── images/
          ├── masonry/
          │   ├── 01.png - 30.png
          └── carousel/
              ├── 01.png - 10.png
```

### Configuración de Vercel

El archivo `vercel.json` está configurado con redirecciones y reescrituras para asegurar que el CSS/JS cargue correctamente:

```json
{
  "redirects": [
    {
      "source": "/viiibe",
      "destination": "/viiibe/",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/viiibe/",
      "destination": "/landing/index.html"
    },
    {
      "source": "/viiibe/(.*)",
      "destination": "/landing/$1"
    }
  ]
}
```

Esto hace que:
- `moood.studio/viiibe` → Redirige a `/viiibe/` (Súper importante para que las rutas relativas funcionen)
- `moood.studio/viiibe/` → Sirve `index.html`
- `moood.studio/viiibe/style.css` → Sirve `/landing/style.css`
- `moood.studio/viiibe/images/...` → Sirve los assets correctamente

### Testing Local

Para probar localmente antes de deploy:

```bash
cd /Users/elnegro/Figma-plugins/viiibe-plugin
vercel dev
```

Luego visita: `http://localhost:3000/viiibe`

### Troubleshooting

**Problema**: Las imágenes no cargan
- **Solución**: Verifica que las rutas en HTML sean relativas (`images/masonry/01.png`)

**Problema**: 404 en `/viiibe`
- **Solución**: Asegúrate de que `public/landing/` existe y tiene `index.html`

**Problema**: Cambios no se reflejan
- **Solución**: Haz hard refresh (Cmd+Shift+R) o espera 1-2 minutos para propagación de CDN

### Actualizar la Landing Page

1. Edita los archivos en `/landing/`
2. Copia los cambios a `/public/landing/`:
   ```bash
   cp -r landing public/
   ```
3. Commit y push:
   ```bash
   git add .
   git commit -m "Update landing page"
   git push
   ```

### Notas

- La carpeta `/landing/` es la fuente de verdad
- `/public/landing/` es una copia para Vercel
- Siempre edita en `/landing/` y luego copia a `/public/landing/`
