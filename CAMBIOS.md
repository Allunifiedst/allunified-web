# Cambios — Fase 1 (19 nov 2026)

## Seguridad
- **Assessment sin inyección de HTML (XSS):** todo dato del usuario se escapa antes de mostrarse.
- **JavaScript movido a archivos externos** (`public/js/acma.js`, `public/js/site.js`), sin `onclick` en el HTML. Esto permite una CSP estricta.
- **`public/_headers`:** CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy y COOP. Cloudflare Pages lo aplica automáticamente.
- **`public/.well-known/security.txt`** (RFC 9116), con vencimiento el 19 nov 2027. Hay que renovarlo antes de esa fecha.
- **Aviso de privacidad integral** en `/privacidad`, enlazado desde el footer y el assessment, con casilla de consentimiento antes de generar resultados.
- Validación del correo (`type="email"`) y límites de longitud en los campos.

## Assessment ACMA (v1.1)
- Respuestas obligatorias por dominio, con opción «No sé / No aplica» que se excluye del cálculo.
- Fortalezas solo con 60 % o más y debilidades solo por debajo de 50 %. Ya no lista «fortalezas» con 0 %.
- Prioridad crítica solo por debajo de 35 %. Una empresa madura ya no recibe riesgos críticos inventados.
- Roadmap que combina los 2 dominios más bajos. Servicios sugeridos con los mismos nombres de la página principal y sin duplicados.
- Se quitó «Ponderación ACMA» de cada pregunta.
- Etiquetas en español en barras y radar. El radar ahora tiene texto alternativo.
- Textos: «Por qué ACMA» (antes «Complemento descriptivo»), «Índice de resiliencia», mayúsculas unificadas.

## Página principal
- Menú móvil con botón (antes, en celular no había navegación).
- Los títulos de sección ya no quedan ocultos bajo el encabezado fijo.
- Metodología con un texto distinto por etapa.
- «Tecnologías» ya no mezcla marcos (NIST/ISO).
- `<!doctype html>`, favicon, canonical y Open Graph básico.
- Respeta `prefers-reduced-motion`.

## Imágenes
- Logo: de 817 KB a 10 KB (`images/logo.webp`). Se eliminaron `logo-original.jpeg`, `logo-alt.jpeg` y `logo-showcase.png`.

## Nuevos archivos
`src/pages/privacidad.astro`, `public/js/acma.js`, `public/js/site.js`, `public/_headers`,
`public/.well-known/security.txt`, `public/robots.txt`, `public/sitemap.xml`, `public/favicon.png`,
`public/apple-touch-icon.png`, `public/images/logo.webp`, `public/images/logo.png`.

## Cómo publicarlo
1. Copia el contenido de este ZIP sobre tu carpeta local del repositorio (reemplazando archivos).
2. Borra del repositorio las imágenes viejas:
   `git rm public/images/logo-original.jpeg public/images/logo-alt.jpeg public/images/logo-showcase.png`
3. `npm run build` y revisa con `npm run preview` (abre /, /assessment y /privacidad).
4. `git add -A && git commit -m "Fase 1: seguridad, ACMA v1.1, aviso de privacidad" && git push`

## Antes de publicar, revisa en Cloudflare
- **Rocket Loader desactivado** (Speed → Optimization). Modifica los scripts y choca con la CSP.
- Si activas **Cloudflare Web Analytics**, agrega `https://static.cloudflareinsights.com` a `script-src` y `https://cloudflareinsights.com` a `connect-src` en `_headers`.
- Crea el buzón **privacidad@allunifiedst.com**. El aviso lo menciona.
- Después de publicar, verifica en securityheaders.com (objetivo: calificación A).
