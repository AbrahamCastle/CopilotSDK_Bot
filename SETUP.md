# Guía de Setup Rápido

## 1. Instalar Copilot CLI

Si aún no tienes el Copilot CLI:

### Windows (PowerShell como administrador)
```powershell
winget install GitHub.GitHubCopilotCLI
```

### Mac/Linux
```bash
brew install gh
gh extension install github/gh-copilot
```

### Verificar instalación
```bash
copilot --version
gh auth login  # Si no estás autenticado
```

## 2. Instalar Dependencias del Bot

```bash
cd sicem-telegram-bot
npm install
```

## 3. Configurar Telegram Bot

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Responde las preguntas:
   - Nombre del bot: `SICEM Dev Bot`
   - Username: `sicem_dev_bot` (debe terminar en `_bot`)
4. BotFather te dará un token, guárdalo

## 4. Obtener GitHub Token

1. Ve a https://github.com/settings/tokens/new
2. Nombra el token: `SICEM Bot`
3. Expiration: `No expiration` o el tiempo que prefieras
4. Selecciona scopes:
   - ✅ `repo` (todos los sub-scopes)
   - ✅ `copilot`
5. Click "Generate token"
6. **COPIA EL TOKEN** (solo se muestra una vez)

## 5. Configurar .env

```bash
cp .env.example .env
```

Edita `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz  # De BotFather
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # De GitHub settings
SICEM_REPO_OWNER=tu-usuario-github  # Tu usuario de GitHub
SICEM_REPO_NAME=SICEM
SICEM_REPO_BRANCH=main

# Opcional: para transcripción de voz
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

## 6. Ejecutar el Bot

```bash
npm run dev
```

Deberías ver:
```
[timestamp] INFO: Starting SICEM Telegram Bot...
[timestamp] INFO: Starting Copilot CLI client...
[timestamp] INFO: Copilot CLI client started successfully
[timestamp] INFO: Bot initialized, starting polling...
[timestamp] INFO: Bot is running! Press Ctrl+C to stop.
```

## 7. Probar el Bot

1. Abre Telegram
2. Busca tu bot por su username
3. Envía `/start`
4. Deberías ver el mensaje de bienvenida

## 8. Tu Primer Comando

Envía al bot:
```
/crear
```

Luego responde:
```
Crear módulo de Inventario con campos: nombre, cantidad, precio
```

El bot debería:
- ✅ Cargar la receta desde tu repo SICEM
- ✅ Personalizar el prompt
- ✅ Ejecutar Copilot SDK
- ✅ Generar el código

## 9. Configuración Opcional: Voz

Si quieres transcripción de voz:

1. Crea cuenta en https://platform.openai.com
2. Agrega créditos ($5 mínimo)
3. Crea API key: https://platform.openai.com/api-keys
4. Agrega a `.env`:
   ```env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
   ```

## 10. Restricción de Usuarios (Recomendado)

Para que solo tú puedas usar el bot:

1. Busca [@userinfobot](https://t.me/userinfobot) en Telegram
2. Te dirá tu User ID (número)
3. Agrégalo a `.env`:
   ```env
   AUTHORIZED_USERS=123456789
   ```

Para múltiples usuarios:
```env
AUTHORIZED_USERS=123456789,987654321,555555555
```

## Troubleshooting

### Error: "Copilot CLI not found"
```bash
# Verificar instalación
which copilot  # Mac/Linux
where copilot  # Windows

# Si no está instalado, instalar:
winget install GitHub.GitHubCopilotCLI  # Windows
brew install gh && gh extension install github/gh-copilot  # Mac
```

### Error: "Invalid token"
- Verifica que copiaste el token completo
- Regenera el token si es necesario
- Asegúrate de que no tiene espacios al inicio/final

### Error: "Recipe not found"
- Verifica que las recetas existan en tu repo SICEM
- URL debe ser: `https://raw.githubusercontent.com/TU-USUARIO/SICEM/main/.copilot/recipes/crear-crud-completo.md`
- Verifica que el repo sea público o que el token tenga acceso

### Bot no responde
- Verifica que el proceso esté corriendo
- Revisa los logs en la consola
- Envía `/status` para verificar conexiones

## ¡Listo!

Tu bot está configurado. Ahora puedes:
- 🎙️ Enviar comandos de voz
- 💬 Chatear con el bot
- 🤖 Crear módulos automáticamente
- 📊 Analizar tu código
- 🔧 Agregar funcionalidades

Para deploy en producción, consulta el README principal.
