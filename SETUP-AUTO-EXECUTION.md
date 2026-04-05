# 🚀 Configuración de Ejecución Automática

Este bot ahora puede ejecutar cambios automáticamente en tu repositorio SICEM.

## ✅ Requisitos Previos

1. **Git instalado** en tu sistema
2. **GitHub Token** con permisos de escritura
3. **Copilot CLI** instalado y autenticado

## 📝 Pasos de Configuración

### 1. Actualiza tu archivo `.env`

Agrega o actualiza esta línea en tu `.env`:

```bash
# Ruta donde se clonará el repositorio SICEM
SICEM_REPO_PATH=./workspace/sicem
```

### 2. Asegura que tu GitHub Token tiene permisos

Tu `GITHUB_TOKEN` debe tener estos scopes:
- ✅ `repo` (acceso completo al repositorio)
- ✅ `copilot` (acceso a Copilot)
- ✅ `workflow` (si usas GitHub Actions)

Genera un nuevo token en: https://github.com/settings/tokens

### 3. Primera ejecución

Cuando inicies el bot, automáticamente:
1. Clonará tu repositorio SICEM en `./workspace/sicem`
2. Configurará git para usar tu token
3. Estará listo para ejecutar cambios

```bash
npm start
```

## 🎯 Cómo Funciona

### Flujo de Ejecución Automática

1. **Usuario envía comando**: "generar pdf de cotizaciones"
2. **Bot carga la receta**: Template de la funcionalidad
3. **Copilot ejecuta**: Crea/modifica archivos en `./workspace/sicem`
4. **Git commit automático**: `feat: generar pdf de cotizaciones`
5. **Git push automático**: Cambios subidos a GitHub
6. **Respuesta al usuario**: Lista de archivos modificados

### Ejemplo de Uso

```
Usuario: generar pdf de cotizaciones

Bot responde:
⏳ Cargando receta...
🔄 Copilot está ejecutando los cambios...
✅ ¡Cambios ejecutados exitosamente!

[Código generado...]

📁 Archivos modificados:
• app/cotizaciones/pdf/route.ts
• components/cotizaciones/pdf-button.tsx
• lib/pdf/cotizacion-pdf.tsx

🔄 Cambios commitados y pusheados a GitHub
```

## 🔐 Seguridad

### Usuarios Autorizados

Configura `AUTHORIZED_USERS` en tu `.env` para limitar quién puede usar el bot:

```bash
# Solo estos usuarios pueden ejecutar comandos
AUTHORIZED_USERS=123456789,987654321
```

### Permisos de Copilot

El bot auto-aprueba todas las solicitudes de permisos de Copilot para:
- Lectura de archivos
- Escritura de archivos
- Ejecución de comandos (git)
- Acceso al repositorio

## 🛠️ Troubleshooting

### Error: "Repository not initialized"

**Solución**: Verifica que:
1. `SICEM_REPO_PATH` esté configurado
2. Tengas permisos de escritura en esa carpeta
3. Tu GitHub Token sea válido

### Error: "Permission denied (publickey)"

**Solución**: El bot usa HTTPS, no SSH. Verifica que:
1. Tu `GITHUB_TOKEN` esté correctamente configurado
2. El token tenga scope `repo`

### Los cambios no aparecen en GitHub

**Solución**:
1. Revisa los logs del bot para ver errores de git
2. Verifica que el branch configurado exista
3. Asegúrate de tener permisos push en el repositorio

## 📊 Logs

El bot registra toda la actividad:

```
[INFO] Starting Copilot CLI client...
[INFO] Cloning repository... {"repoUrl":"https://github.com/..."}
[INFO] Repository initialized successfully
[INFO] Committing changes... {"message":"feat: generar pdf"}
[INFO] Changes committed and pushed successfully
```

## 🔄 Sincronización

El bot hace `git pull` cada vez que inicia para mantener el repositorio actualizado.

Si trabajas en el repositorio manualmente mientras el bot está corriendo, puedes tener conflictos. Se recomienda:
- Trabajar en branches diferentes
- O reiniciar el bot después de hacer cambios manuales

## ⚙️ Variables de Entorno Completas

```bash
# Requeridas
TELEGRAM_BOT_TOKEN=xxx
GITHUB_TOKEN=xxx
SICEM_REPO_OWNER=xxx
SICEM_REPO_NAME=SICEM
SICEM_REPO_BRANCH=main
SICEM_REPO_PATH=./workspace/sicem

# Opcionales
OPENAI_API_KEY=xxx           # Para transcripción de voz
AUTHORIZED_USERS=xxx,yyy     # Control de acceso
COPILOT_MODEL=claude-sonnet-4.5
LOG_LEVEL=info
NODE_ENV=production
```

## 🎉 ¡Listo!

Tu bot ahora puede:
- ✅ Generar código con Copilot
- ✅ Ejecutar cambios automáticamente
- ✅ Hacer commits y push a GitHub
- ✅ Notificar al usuario de los cambios

**Importante**: Revisa siempre los cambios en GitHub antes de desplegarlos a producción.
