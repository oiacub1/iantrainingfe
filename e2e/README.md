# Tests E2E con Playwright

Este directorio contiene los tests end-to-end (E2E) para la plataforma de entrenamiento, utilizando Playwright.

## 📋 Requisitos Previos

1. **Backend en ejecución**: Asegúrate de que el backend de Go esté corriendo en `http://localhost:8080`
2. **DynamoDB Local**: Si usas DynamoDB local, debe estar activo
3. **Navegadores de Playwright**: Instala los navegadores necesarios (ver instrucciones abajo)

## 🚀 Instalación

### Instalar navegadores de Playwright

Después de instalar las dependencias con `npm install`, ejecuta:

```bash
npx playwright install
```

Esto descargará los navegadores necesarios (Chromium, Firefox, WebKit).

## 🧪 Ejecutar Tests

### Ejecutar todos los tests (modo headless)

```bash
npm run test:e2e
```

### Ejecutar tests con interfaz visual

```bash
npm run test:e2e:ui
```

### Ejecutar tests viendo el navegador (headed mode)

```bash
npm run test:e2e:headed
```

### Ver el reporte de tests

```bash
npm run test:e2e:report
```

## 📝 Tests Disponibles

### `register.spec.ts` - Tests de Registro de Usuario

Este archivo contiene tests completos para el flujo de registro:

1. **Registro exitoso de estudiante**: 
   - Completa el formulario con datos válidos
   - Verifica redirección al dashboard del estudiante

2. **Registro exitoso de trainer**:
   - Completa el formulario seleccionando rol TRAINER
   - Verifica redirección al dashboard del trainer

3. **Error de email duplicado** ⭐:
   - Registra un usuario exitosamente
   - Intenta registrar el mismo email nuevamente
   - Verifica que aparece un mensaje de error
   - Confirma que el backend maneja correctamente el error

4. **Validación de contraseñas**:
   - Verifica que las contraseñas deben coincidir
   - Muestra error si no coinciden

5. **Validación de campos requeridos**:
   - Verifica que todos los campos son obligatorios

6. **Validación de longitud de contraseña**:
   - Verifica que la contraseña debe tener al menos 6 caracteres

## 🔧 Configuración

La configuración de Playwright está en `playwright.config.ts`:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Navegadores**: Chromium, Firefox, WebKit
- **Web Server**: Inicia automáticamente el servidor de desarrollo si no está corriendo

## 💡 Notas Importantes

### Emails Únicos

Los tests generan emails únicos usando timestamps para evitar conflictos:

```typescript
const generateUniqueEmail = () => {
  const timestamp = Date.now();
  return `test.user.${timestamp}@example.com`;
};
```

### Test de Email Duplicado

El test de email duplicado es especialmente importante porque:

1. Registra un usuario exitosamente
2. Navega de vuelta a la página de registro
3. Intenta registrar el mismo email
4. Verifica que el backend retorna un error 400
5. Confirma que el frontend muestra el mensaje de error apropiado

Este test valida que el backend de Go maneja correctamente la restricción de unicidad del email.

## 🐛 Debugging

### Ver el navegador durante los tests

```bash
npm run test:e2e:headed
```

### Usar el modo UI para debugging interactivo

```bash
npm run test:e2e:ui
```

### Ver trazas de tests fallidos

Playwright automáticamente captura trazas cuando un test falla. Para verlas:

```bash
npm run test:e2e:report
```

## 📊 Estructura de Tests

```
e2e/
├── README.md           # Este archivo
└── register.spec.ts    # Tests de registro
```

## 🔄 Flujo de Ejecución

1. Playwright inicia el servidor de desarrollo (`npm run dev`)
2. Espera a que el servidor esté disponible en `http://localhost:5173`
3. Ejecuta los tests en paralelo (configurable)
4. Genera un reporte HTML con los resultados

## ✅ Mejores Prácticas

- **Datos únicos**: Usa `generateUniqueEmail()` para evitar conflictos
- **Esperas explícitas**: Usa `expect().toHaveURL()` con timeouts apropiados
- **Selectores robustos**: Usa IDs (`#name`, `#email`) cuando sea posible
- **Limpieza**: Los tests son independientes y no requieren limpieza manual

## 🚨 Troubleshooting

### Error: "Target page, context or browser has been closed"

- Asegúrate de que el backend esté corriendo
- Verifica que el frontend puede conectarse al backend
- Aumenta los timeouts si es necesario

### Error: "Timeout waiting for navigation"

- Verifica que el backend responde correctamente
- Revisa los logs del backend para errores
- Asegúrate de que DynamoDB está disponible

### Tests fallan por email duplicado

- Los tests generan emails únicos automáticamente
- Si persiste, verifica que el backend limpia correctamente los datos de test
