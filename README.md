# Financial Intelligence Terminal · Vercel + iOS

## Deploy en 5 pasos

### 1. Subir a GitHub
1. Creá un repo nuevo en https://github.com (puede ser privado)
2. Subí todos los archivos de esta carpeta

### 2. Conectar con Vercel
1. Entrá a https://vercel.com → Sign up con GitHub
2. "Add New Project" → Importá tu repo
3. Framework Preset: **Vite** (lo detecta automáticamente)
4. Hacé click en **Deploy**

### 3. Configurar la API Key (IMPORTANTE)
1. En Vercel → tu proyecto → **Settings → Environment Variables**
2. Agregá una variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu API key de Anthropic (conseguila en https://console.anthropic.com)
   - **Environments:** Production, Preview, Development ✓
3. **Redeploy** (Deployments → botón "Redeploy")

### 4. Usar desde iPhone como app
1. Abrí tu URL de Vercel en **Safari** (ej: https://mi-terminal.vercel.app)
2. Toca el botón **Compartir** (cuadrado con flecha ↑)
3. Desplazate y tocá **"Agregar a pantalla de inicio"**
4. Elegí el nombre y tocá **Agregar**
→ Aparece como app con ícono en tu home screen

### 5. Exportar informes desde iPhone
Al tocar "↑ Compartir Informe":
- Se abre el **Share Sheet nativo de iOS**
- Tocá **"Guardar en Archivos"**
- Elegí **iCloud Drive** o **En este iPhone**
- La carpeta se crea automáticamente con el nombre del balance (ej: `AAPL_Q1_2025`)

---

## Estructura del proyecto

```
financial-terminal-vercel/
├── api/
│   └── analyze.js          ← Función serverless (API key segura aquí)
├── src/
│   ├── main.jsx            ← Entrada React
│   └── App.jsx             ← App completa
├── public/
│   ├── manifest.json       ← Config PWA
│   ├── icon-192.png        ← Ícono app
│   └── icon-512.png        ← Ícono app grande
├── index.html              ← Entry HTML con meta tags iOS
├── vite.config.js
├── vercel.json
└── package.json
```

## Diferencias vs versión Claude.ai

| Feature                | Versión Claude.ai     | Versión Vercel/iOS       |
|------------------------|-----------------------|--------------------------|
| API Key                | Manejada por Anthropic | Env var en Vercel (segura)|
| Exportar               | Carpeta en escritorio  | Share Sheet iOS / Folder  |
| Mobile                 | Limitado              | Optimizado responsive     |
| Instalable como app    | No                    | Sí (PWA)                  |
| PDF upload             | Sí                    | Sí                        |

## Dev local (opcional)

```bash
npm install
# Creá un archivo .env.local con:
# ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

> Nota: Para desarrollo local el proxy de Vite no maneja env vars del servidor.
> Usá un archivo `.env.local` y ajustá `api/analyze.js` para leer de `process.env`.
