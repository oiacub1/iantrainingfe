import { test, expect } from '@playwright/test';

// Generar un email único para cada ejecución del test
const generateUniqueEmail = () => {
  const timestamp = Date.now();
  return `test.user.${timestamp}@example.com`;
};

test.describe('Registro de Usuario E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de registro antes de cada test
    await page.goto('/register');
  });

  test('debe registrar un nuevo usuario exitosamente', async ({ page }) => {
    // Generar datos únicos para el test
    const uniqueEmail = generateUniqueEmail();
    const testData = {
      name: 'Usuario Test',
      email: uniqueEmail,
      password: 'password123',
    };

    // Completar el formulario de registro
    await page.fill('#name', testData.name);
    await page.fill('#email', testData.email);
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.password);

    // Seleccionar el rol de STUDENT (ya está seleccionado por defecto, pero lo hacemos explícito)
    await page.check('input[type="radio"][value="STUDENT"]');

    // Hacer clic en el botón de registro
    await page.click('button[type="submit"]');

    // Esperar a que la navegación ocurra o aparezca un mensaje de éxito
    // Verificar que redirige al dashboard del estudiante
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 10000 });

    // Verificar que estamos en el dashboard (puede haber un título o elemento específico)
    await expect(page.locator('body')).toContainText(/welcome|bienvenido|current routine|rutina actual/i, { timeout: 5000 });
  });

  test('debe registrar un nuevo trainer exitosamente', async ({ page }) => {
    // Generar datos únicos para el test
    const uniqueEmail = generateUniqueEmail();
    const testData = {
      name: 'Trainer Test',
      email: uniqueEmail,
      password: 'password123',
    };

    // Completar el formulario de registro
    await page.fill('#name', testData.name);
    await page.fill('#email', testData.email);
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.password);

    // Seleccionar el rol de TRAINER
    await page.check('input[type="radio"][value="TRAINER"]');

    // Hacer clic en el botón de registro
    await page.click('button[type="submit"]');

    // Esperar a que la navegación ocurra
    // Verificar que redirige al dashboard del trainer
    await expect(page).toHaveURL(/\/trainer\/dashboard/, { timeout: 10000 });

    // Verificar que estamos en el dashboard
    await expect(page.locator('body')).toContainText(/welcome|bienvenido|my students|mis estudiantes/i, { timeout: 5000 });
  });

  test('debe mostrar error al intentar registrar un email duplicado', async ({ page }) => {
    // Usar un email fijo para este test
    const duplicateEmail = generateUniqueEmail();
    const testData = {
      name: 'Usuario Duplicado',
      email: duplicateEmail,
      password: 'password123',
    };

    // Primer registro - debe ser exitoso
    await page.fill('#name', testData.name);
    await page.fill('#email', testData.email);
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.password);
    await page.check('input[type="radio"][value="STUDENT"]');
    await page.click('button[type="submit"]');

    // Esperar a que el primer registro sea exitoso
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 10000 });

    // Volver a la página de registro para intentar crear el mismo usuario
    await page.goto('/register');

    // Intentar registrar el mismo email nuevamente
    await page.fill('#name', 'Otro Usuario');
    await page.fill('#email', testData.email); // Mismo email
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.password);
    await page.check('input[type="radio"][value="STUDENT"]');
    await page.click('button[type="submit"]');

    // Verificar que aparece un mensaje de error
    const errorMessage = page.locator('.bg-red-100, .text-red-700, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verificar que el mensaje contiene información sobre error (el backend puede devolver mensaje genérico)
    await expect(errorMessage).toContainText(/error|registr/i);

    // Verificar que NO redirige (permanece en la página de registro)
    await expect(page).toHaveURL(/\/register/);
  });

  test('debe validar que las contraseñas coincidan', async ({ page }) => {
    const testData = {
      name: 'Usuario Test',
      email: generateUniqueEmail(),
      password: 'password123',
      wrongPassword: 'password456',
    };

    // Completar el formulario con contraseñas diferentes
    await page.fill('#name', testData.name);
    await page.fill('#email', testData.email);
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.wrongPassword);
    await page.check('input[type="radio"][value="STUDENT"]');
    await page.click('button[type="submit"]');

    // Verificar que aparece un mensaje de error
    const errorMessage = page.locator('.bg-red-100, .text-red-700, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verificar que el mensaje menciona las contraseñas
    await expect(errorMessage).toContainText(/contraseña|password|coincid|match/i);

    // Verificar que NO redirige
    await expect(page).toHaveURL(/\/register/);
  });

  test('debe validar campos requeridos', async ({ page }) => {
    // Intentar enviar el formulario vacío
    await page.click('button[type="submit"]');

    // Los campos HTML5 required deberían prevenir el envío
    // Verificar que permanecemos en la página de registro
    await expect(page).toHaveURL(/\/register/);

    // Verificar que los campos tienen el atributo required
    await expect(page.locator('#name')).toHaveAttribute('required', '');
    await expect(page.locator('#email')).toHaveAttribute('required', '');
    await expect(page.locator('#password')).toHaveAttribute('required', '');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('required', '');
  });

  test('debe validar longitud mínima de contraseña', async ({ page }) => {
    const testData = {
      name: 'Usuario Test',
      email: generateUniqueEmail(),
      password: '12345', // Menos de 6 caracteres
    };

    // Completar el formulario con contraseña corta
    await page.fill('#name', testData.name);
    await page.fill('#email', testData.email);
    await page.fill('#password', testData.password);
    await page.fill('#confirmPassword', testData.password);
    await page.check('input[type="radio"][value="STUDENT"]');
    
    // Verificar que el campo de contraseña tiene validación HTML5 de longitud mínima
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('minlength', '6');
    
    // Intentar enviar el formulario
    await page.click('button[type="submit"]');

    // Verificar que NO redirige (la validación HTML5 debería prevenir el envío)
    await expect(page).toHaveURL(/\/register/);
  });
});
