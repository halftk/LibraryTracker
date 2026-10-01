# Reglas del Proyecto LibraryTracker

## 🧪 Pruebas Automáticas y Mantenimiento de Tests Obligatorio
- **Mantenimiento y Creación de Tests**: Con **cada cambio o nueva funcionalidad** que se agregue al código, se debe:
  - Crear nuevas pruebas unitarias/de integración para la lógica nueva o componente creado.
  - Actualizar o adaptar las pruebas existentes que se vean afectadas por cambios en el comportamiento.
- **Ejecución de Pruebas**: Después de realizar cualquier cambio en el código, **SIEMPRE** se debe ejecutar `npm run test` para validar que todas las pruebas unitarias pasen al 100% y no existan regresiones en runtime ni en la interfaz.
- **Compilación**: Ejecutar `npm run build` para garantizar que la compilación de producción con TypeScript y Astro no contenga errores.
