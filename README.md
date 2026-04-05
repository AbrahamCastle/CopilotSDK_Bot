# SICEM Telegram Bot 🤖

Bot de Telegram que automatiza el desarrollo en SICEM usando GitHub Copilot SDK.

## 🎯 Características

- ✅ **Comandos de voz y texto** - Habla o escribe tus comandos
- ✅ **Integración con Copilot SDK** - Usa el mismo motor del Copilot CLI
- ✅ **Recetas predefinidas** - CRUD completo, agregar funcionalidades, análisis, refactorización
- ✅ **Feedback en tiempo real** - Streaming de respuestas
- ✅ **Multi-usuario** - Control de acceso por ID de Telegram
- ✅ **Transcripción de voz** - Whisper API para notas de voz

## 📋 Requisitos Previos

1. **Node.js 20+** instalado
2. **GitHub Copilot CLI** instalado y autenticado
   ```bash
   gh copilot --version
   ```
3. **Cuenta de Telegram** y acceso a @BotFather
4. **GitHub Token** con acceso a Copilot

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

Edita `.env`:
```env
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
GITHUB_TOKEN=tu_github_token
SICEM_REPO_OWNER=tu-usuario
SICEM_REPO_NAME=SICEM
OPENAI_API_KEY=tu_openai_key  # Opcional para voz
```

### 3. Crear bot en Telegram

1. Habla con [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Sigue las instrucciones
4. Copia el token y pégalo en `.env`

### 4. Obtener GitHub Token

1. Ve a https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Selecciona scopes: `repo`, `copilot`
4. Copia el token y pégalo en `.env`

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

## 📱 Uso

### Comandos Disponibles

#### `/start`
Inicia el bot y muestra mensaje de bienvenida.

#### `/help`
Muestra todos los comandos disponibles.

#### `/crear`
Inicia el flujo para crear un módulo CRUD completo.

**Ejemplo:**
```
Usuario: /crear
Bot: ¿Qué módulo quieres crear?
Usuario: Proveedores con campos nombre, RFC, email
Bot: ⏳ Generando código con Copilot...
     ✅ Módulo creado! Revisa los cambios en tu repo.
```

#### `/agregar`
Agrega funcionalidad a un módulo existente.

**Ejemplo:**
```
Usuario: /agregar
Bot: ¿Qué funcionalidad quieres agregar y a qué módulo?
Usuario: Exportar a Excel en módulo de Clientes
Bot: ⏳ Agregando funcionalidad...
```

#### `/analizar`
Analiza un módulo existente en profundidad.

**Ejemplo:**
```
Usuario: /analizar
Bot: ¿Qué módulo quieres analizar?
Usuario: Cotizaciones
Bot: 🔍 Analizando módulo de Cotizaciones...
```

#### `/refactorizar`
Refactoriza componente siguiendo mejores prácticas.

#### `/status`
Muestra el estado del bot y conexión con Copilot.

### Comandos de Voz 🎙️

Puedes enviar notas de voz en lugar de texto. El bot:
1. Transcribe tu audio con Whisper
2. Procesa el comando
3. Ejecuta la acción

**Ejemplo:**
- 🎙️ "Crea un módulo de proveedores con nombre y RFC"
- Bot transcribe y ejecuta

### Modo Conversacional

También puedes chatear directamente sin comandos:

```
Usuario: Necesito crear un módulo nuevo para inventario
Bot: 🤖 Voy a crear un módulo CRUD completo para Inventario.
     ¿Qué campos necesitas?
Usuario: Nombre, cantidad, precio, categoría
Bot: ⏳ Creando módulo con esos campos...
```

## 🏗️ Arquitectura

```
Telegram
    ↓
Grammy Bot Framework
    ↓
Command Handlers
    ↓
Recipe Loader (carga desde SICEM repo)
    ↓
Copilot SDK Client
    ↓
Copilot CLI (server mode)
    ↓
Genera código en repo SICEM
```

## 📁 Estructura del Proyecto

```
sicem-telegram-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── bot/
│   │   ├── handlers/         # Command handlers
│   │   │   ├── crear.ts
│   │   │   ├── agregar.ts
│   │   │   ├── analizar.ts
│   │   │   └── voice.ts
│   │   └── middleware/       # Auth, logging
│   ├── copilot/
│   │   ├── client.ts         # Copilot SDK wrapper
│   │   └── session.ts        # Session management
│   ├── recipes/
│   │   ├── loader.ts         # Carga recetas desde GitHub
│   │   └── parser.ts         # Parsea input del usuario
│   ├── services/
│   │   ├── github.ts         # GitHub API (PRs, commits)
│   │   └── whisper.ts        # Transcripción de voz
│   └── utils/
│       ├── config.ts         # Configuración
│       └── logger.ts         # Logging
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔧 Desarrollo

### Modo desarrollo con hot reload

```bash
npm run dev
```

### Build para producción

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Formateo

```bash
npm run format
```

## 🚀 Deploy

### Opción 1: Railway.app

1. Crea cuenta en [Railway.app](https://railway.app)
2. Conecta tu repo
3. Agrega variables de entorno
4. Deploy automático

### Opción 2: Fly.io

```bash
flyctl launch
flyctl secrets set TELEGRAM_BOT_TOKEN=xxx
flyctl secrets set GITHUB_TOKEN=xxx
flyctl deploy
```

### Opción 3: VPS (DigitalOcean, AWS, etc.)

```bash
# En el servidor
git clone tu-repo
cd sicem-telegram-bot
npm install
npm run build

# Usar PM2 para mantener corriendo
npm install -g pm2
pm2 start dist/index.js --name sicem-bot
pm2 save
pm2 startup
```

## 🔐 Seguridad

### Restringir acceso por usuario

En `.env`:
```env
AUTHORIZED_USERS=123456789,987654321
```

Solo estos IDs de Telegram podrán usar el bot.

### Obtener tu ID de Telegram

1. Habla con [@userinfobot](https://t.me/userinfobot)
2. Copia tu ID
3. Agrégalo a `AUTHORIZED_USERS`

## 🐛 Troubleshooting

### "Copilot CLI not found"

Asegúrate de que `copilot` esté en el PATH:
```bash
which copilot  # Linux/Mac
where copilot  # Windows
```

Si no está instalado: https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line

### "Invalid GitHub token"

1. Verifica que el token tenga scopes `repo` y `copilot`
2. Verifica que no haya expirado
3. Regenera si es necesario

### "Bot not responding"

1. Verifica las variables de entorno
2. Revisa los logs: `npm run dev` muestra errores
3. Prueba con `/status` para verificar conexión

### "Voice transcription failed"

1. Verifica que `OPENAI_API_KEY` esté configurada
2. Verifica que tengas créditos en OpenAI
3. El audio debe ser < 25 MB

## 📊 Logs

Los logs se guardan en `logs/` con rotación diaria:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Soporte para múltiples repositorios
- [ ] Dashboard web para monitoreo
- [ ] Historial de comandos ejecutados
- [ ] Integración con Slack/Discord
- [ ] Modo interactivo con botones
- [ ] Soporte para custom tools
- [ ] Previews antes de aplicar cambios
- [ ] Rollback de cambios
- [ ] Estadísticas de uso

## 📄 Licencia

MIT

## 🙏 Agradecimientos

- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [Grammy](https://grammy.dev/)
- [OpenAI Whisper](https://openai.com/research/whisper)

---

**Hecho con ❤️ para SICEM**
