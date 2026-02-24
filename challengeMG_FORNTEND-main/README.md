# MEDgemma Challenge - Frontend

Este es el repositorio del Frontend para el proyecto asociado al MEDgemma Challenge. Está construido con React, Vite, TypeScript y Tailwind CSS.

## Requisitos previos

- Node.js (versión 18 o superior recomendada)
- `npm` o `pnpm` como gestor de paquetes

## Instalación y Configuración

1. **Clonar el repositorio** y navegar a la carpeta del proyecto si aún no lo has hecho:
   ```bash
   cd challengeMG_FORNTEND
   ```

2. **Instalar dependencias**:
   Usando npm:
   ```bash
   npm install
   ```
   O si prefieres pnpm (recomendado, el proyecto usa `pnpm-lock.yaml`):
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**:
   Copia el archivo de ejemplo para crear tus variables de entorno locales:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de que la variable `VITE_API_BASE_URL` en el archivo `.env` apunte a la URL de tu backend (por defecto es `http://localhost:8000`).

## Levantando el Proyecto

Para iniciar el servidor local de desarrollo, ejecuta:

```bash
npm run dev
# o con pnpm
pnpm dev
```

El servidor normalmente se iniciará en `http://localhost:5173/` (o en otro puerto si ese está ocupado). Abre esa dirección en tu navegador para ver la aplicación.

## Construcción para Producción

Para generar una versión optimizada para producción:

```bash
npm run build
# o con pnpm
pnpm build
```

Los archivos estáticos generados y listos para desplegar estarán en la carpeta `dist`.
