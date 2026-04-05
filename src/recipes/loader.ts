import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

export type RecipeType = 
  | 'crear-crud-completo'
  | 'agregar-funcionalidad'
  | 'analizar-modulo'
  | 'refactorizar-componente'
  | 'fix-bug';

const RECIPE_FILES: Record<RecipeType, string> = {
  'crear-crud-completo': 'crear-crud-completo.md',
  'agregar-funcionalidad': 'agregar-funcionalidad.md',
  'analizar-modulo': 'analizar-modulo.md',
  'refactorizar-componente': 'refactorizar-componente.md',
  'fix-bug': 'fix-bug.md',
};

export async function loadRecipe(recipeType: RecipeType): Promise<string> {
  const fileName = RECIPE_FILES[recipeType];
  const localPath = path.join(config.sicemRepoPath, '.copilot', 'recipes', fileName);
  
  logger.debug('Loading recipe from local workspace', { recipeType, localPath });

  try {
    // Intentar leer desde el repositorio local
    const content = await fs.readFile(localPath, 'utf-8');
    
    logger.info('Recipe loaded from local workspace', {
      recipeType,
      size: content.length,
      path: localPath,
    });

    return content;
  } catch (error) {
    logger.warn('Recipe file not found in local workspace, using fallback template', { 
      recipeType, 
      localPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return getFallbackRecipe(recipeType);
  }
}

function getFallbackRecipe(recipeType: RecipeType): string {
  const fallbacks: Record<RecipeType, string> = {
    'crear-crud-completo': 
`# Crear Módulo CRUD Completo

Eres un experto en desarrollo de aplicaciones con TypeScript, React, Supabase y TailwindCSS.

Tu tarea es crear un módulo CRUD completo para SICEM basado en las especificaciones del usuario.

**ESTRUCTURA A GENERAR:**
1. Migración SQL para crear la tabla
2. Types TypeScript para la entidad
3. Services CRUD (usar Supabase client)
4. Componentes React (tabla, formulario de creación/edición, modal)
5. Página principal del módulo

**CONTEXTO DEL PROYECTO:**
- Stack: Next.js 14, TypeScript, Supabase, TailwindCSS, Shadcn/ui
- Patrón: Componentes de servidor cuando sea posible
- Validación: Zod schemas
- Estado: React hooks y Zustand para estado global

Genera código limpio, bien tipado y siguiendo las mejores prácticas.`,

    'agregar-funcionalidad': 
`# Agregar Funcionalidad a Módulo

Eres un experto en desarrollo de aplicaciones con TypeScript, React, Supabase y TailwindCSS.

Tu tarea es agregar una nueva funcionalidad a un módulo existente de SICEM.

**ANALIZA PRIMERO:**
1. Busca el módulo mencionado en el código
2. Entiende su estructura actual
3. Identifica dónde agregar la nueva funcionalidad

**GENERA:**
1. Código backend (servicios, API routes si es necesario)
2. Código frontend (componentes, hooks)
3. Tipos TypeScript actualizados
4. Migraciones SQL si se requieren cambios en DB

**CONTEXTO DEL PROYECTO:**
- Stack: Next.js 14, TypeScript, Supabase, TailwindCSS, Shadcn/ui
- Mantén consistencia con el código existente
- Reutiliza componentes y utilities cuando sea posible

**PARA GENERACIÓN DE PDFs:**
Si la funcionalidad involucra generar PDFs, usa @react-pdf/renderer:
- Instalación: npm install @react-pdf/renderer
- Crea componente PDF con Document, Page, View, Text
- API Route para renderizar con renderToStream
- Botón de descarga que llame a la API y descargue el blob

Genera código limpio, bien tipado y siguiendo las mejores prácticas del proyecto.`,

    'analizar-modulo': 
`# Analizar Módulo

Eres un experto en análisis de código y arquitectura de software.

Tu tarea es analizar un módulo de SICEM y proporcionar un informe detallado.

**ANALIZA:**
1. Estructura del módulo
2. Componentes y su jerarquía
3. Servicios y lógica de negocio
4. Queries a la base de datos
5. Manejo de estado
6. Posibles mejoras

**PROPORCIONA:**
1. Resumen de funcionalidad
2. Diagrama de componentes (ASCII art si es necesario)
3. Lista de mejoras sugeridas
4. Problemas de rendimiento o seguridad
5. Oportunidades de refactorización

Sé específico y proporciona ejemplos de código cuando sea relevante.`,

    'refactorizar-componente': 
`# Refactorizar Componente

Eres un experto en refactorización de código React y TypeScript.

Tu tarea es refactorizar un componente siguiendo las mejores prácticas.

**ANALIZA:**
1. El componente actual
2. Sus dependencias
3. Su complejidad

**REFACTORIZA:**
1. Separa lógica de presentación
2. Extrae custom hooks si hay lógica reutilizable
3. Mejora el tipado
4. Optimiza renders
5. Mejora legibilidad

**MANTÉN:**
- Misma funcionalidad
- Compatibilidad con código existente
- Tests si existen

Genera código mejorado, bien documentado y siguiendo mejores prácticas.`,
    'fix-bug':
`# Corregir Bug

Eres un experto en debugging y corrección de regresiones.

Tu tarea es corregir un bug con cambio mínimo, seguro y orientado a causa raíz.

**IMPLEMENTA:**
1. Reproducir y diagnosticar el bug
2. Aplicar fix mínimo sin romper comportamiento existente
3. Mantener tipos TypeScript correctos
4. Agregar o ajustar test de regresión
5. Validar que el bug queda resuelto

**PRIORIDADES:**
- Seguridad y permisos correctos
- Manejo de errores consistente
- No hacer refactors grandes

Entrega cambios listos para PR con resumen de causa raíz y archivos modificados.`,
  };

  return fallbacks[recipeType];
}

export function detectRecipeType(input: string): RecipeType | null {
  const lower = input.toLowerCase();

  if (
    lower.includes('crear módulo') ||
    lower.includes('crear modulo') ||
    lower.includes('nuevo módulo') ||
    lower.includes('crud')
  ) {
    return 'crear-crud-completo';
  }

  if (
    lower.includes('fix bug') ||
    lower.includes('fix-bug') ||
    lower.includes('corregir bug') ||
    lower.includes('arreglar bug') ||
    lower.includes('bug') ||
    lower.includes('error') ||
    lower.includes('falla') ||
    lower.includes('falla') ||
    lower.includes('regresión') ||
    lower.includes('regresion')
  ) {
    return 'fix-bug';
  }

  if (
    lower.includes('agregar') ||
    lower.includes('añadir') ||
    lower.includes('nueva función') ||
    lower.includes('nueva funcionalidad') ||
    lower.includes('exportar') ||
    lower.includes('importar') ||
    lower.includes('generar pdf') ||
    lower.includes('pdf') ||
    lower.includes('descargar') ||
    lower.includes('imprimir')
  ) {
    return 'agregar-funcionalidad';
  }

  if (
    lower.includes('analizar') ||
    lower.includes('analisis') ||
    lower.includes('análisis') ||
    lower.includes('revisar')
  ) {
    return 'analizar-modulo';
  }

  if (
    lower.includes('refactorizar') ||
    lower.includes('refactor') ||
    lower.includes('mejorar') ||
    lower.includes('optimizar')
  ) {
    return 'refactorizar-componente';
  }

  return null;
}

export function personalizeRecipe(
  recipeTemplate: string,
  userInput: string
): string {
  let prompt = recipeTemplate;

  // Si el template tiene un bloque de código, extraerlo
  const promptMatch = recipeTemplate.match(/```\n([\s\S]*?)\n```/);
  if (promptMatch) {
    prompt = promptMatch[1];
  }

  // Básica personalización
  // Extraer nombre de entidad/módulo
  const entityMatch = userInput.match(/(?:módulo|modulo)\s+(?:de\s+)?([A-Za-zÁ-ú]+)/i);
  if (entityMatch) {
    const entityName = entityMatch[1];
    prompt = prompt.replace(/\[NOMBRE_ENTIDAD\]/g, entityName);
    prompt = prompt.replace(/\[nombre_tabla_sql\]/g, entityName.toLowerCase());
    prompt = prompt.replace(/\[Módulo\]/g, entityName);
    prompt = prompt.replace(/\[modulo\]/g, entityName.toLowerCase());
  }

  // Agregar contexto adicional del usuario
  prompt += `\n\n**REQUEST DEL USUARIO:**\n${userInput}\n`;
  prompt += `\n**IMPORTANTE:** Trabaja en el repositorio ${config.sicemRepoOwner}/${config.sicemRepoName} (branch: ${config.sicemRepoBranch})`;

  return prompt;
}
