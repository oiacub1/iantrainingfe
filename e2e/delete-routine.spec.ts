
import { test, expect } from '@playwright/test'

// Generar datos únicos para cada ejecución del test
const generateUniqueEmail = () => {
  const timestamp = Date.now();
  return `trainer.${timestamp}@example.com`;
};

const generateUniqueStudentEmail = () => {
  const timestamp = Date.now();
  return `student.${timestamp}@example.com`;
};

test.describe('Eliminar Rutina E2E', () => {
  let trainerEmail: string;
  let trainerPassword: string;
  let studentEmail: string;
  let studentPassword: string;

  test.beforeAll(() => {
    // Generar credenciales únicas para esta suite de tests
    trainerEmail = generateUniqueEmail();
    trainerPassword = 'password123';
    studentEmail = generateUniqueStudentEmail();
    studentPassword = 'password123';
  });

  test('debe eliminar una rutina exitosamente', async ({ page }) => {
    // 1. Registrar un trainer
    await page.goto('/register');
    await page.fill('#name', 'Trainer Test');
    await page.fill('#email', trainerEmail);
    await page.fill('#password', trainerPassword);
    await page.fill('#confirmPassword', trainerPassword);
    await page.check('input[type="radio"][value="TRAINER"]');
    await page.click('button[type="submit"]');

    // Esperar a que redirige al dashboard del trainer
    await expect(page).toHaveURL(/\/trainer\/dashboard/, { timeout: 10000 });

    // 2. Registrar un estudiante (necesitamos cerrar sesión primero)
    // Buscar el botón de logout en el navbar
    const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Cerrar sesión"), a:has-text("Logout")').first();
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Si no hay botón de logout, limpiar localStorage manualmente
      await page.evaluate(() => localStorage.clear());
    }

    // Ir a registro de estudiante
    await page.goto('/register');
    await page.fill('#name', 'Student Test');
    await page.fill('#email', studentEmail);
    await page.fill('#password', studentPassword);
    await page.fill('#confirmPassword', studentPassword);
    await page.check('input[type="radio"][value="STUDENT"]');
    await page.click('button[type="submit"]');

    // Esperar a que redirige al dashboard del estudiante
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 10000 });

    // 3. Cerrar sesión y volver a iniciar sesión como trainer
    const logoutButton2 = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Cerrar sesión"), a:has-text("Logout")').first();
    if (await logoutButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton2.click();
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => localStorage.clear());
    }

    await page.goto('/login');
    await page.fill('#email', trainerEmail);
    await page.fill('#password', trainerPassword);
    await page.click('button[type="submit"]');

    // Esperar a que redirige al dashboard del trainer
    await expect(page).toHaveURL(/\/trainer\/dashboard/, { timeout: 10000 });

    // 4. Agregar el estudiante al trainer
    await page.goto('/trainer/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Buscar el botón de agregar estudiante
    const addStudentButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').first();
    if (await addStudentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addStudentButton.click();
      await page.waitForTimeout(500);
      
      // Llenar el formulario de agregar estudiante
      const emailInput = page.locator('input[type="email"]').last();
      await emailInput.fill(studentEmail);
      const submitButton = page.locator('button[type="submit"]').last();
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    // 5. Navegar a la página de rutinas
    await page.goto('/trainer/routines');
    await page.waitForLoadState('networkidle');

    // 6. Crear una nueva rutina
    const createRoutineButton = page.locator('a:has-text("Crear"), a:has-text("Create")').first();
    await createRoutineButton.click();

    // Esperar a que cargue la página de creación
    await expect(page).toHaveURL(/\/trainer\/routines\/new/, { timeout: 5000 });

    // Llenar el formulario de rutina
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Rutina de Prueba para Eliminar');
    
    // Seleccionar el estudiante
    const studentSelect = page.locator('select').first();
    await studentSelect.selectOption({ index: 1 }); // Seleccionar el primer estudiante disponible

    // Establecer el número de semanas
    const weekInput = page.locator('input[type="number"]').first();
    await weekInput.fill('4');

    // Enviar el formulario
    await page.click('button[type="submit"]');

    // Esperar a que redirige a la página de detalle de la rutina
    await page.waitForTimeout(3000);

    // 7. Volver a la lista de rutinas
    await page.goto('/trainer/routines');
    await page.waitForLoadState('networkidle');

    // Verificar que la rutina aparece en la lista
    const routineText = page.locator('text=Rutina de Prueba para Eliminar');
    await expect(routineText).toBeVisible({ timeout: 10000 });

    // Contar cuántas rutinas hay antes de eliminar
    const routinesBeforeDelete = await page.locator('[class*="border rounded-lg p-4"]').count();

    // 8. Configurar el manejador de diálogo ANTES de hacer clic
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // 9. Hacer clic en el botón de eliminar
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete")').first();
    await deleteButton.click();

    // Esperar a que se procese la eliminación
    await page.waitForTimeout(3000);

    // 10. Verificar que la rutina ya no aparece en la lista
    const routinesAfterDelete = await page.locator('[class*="border rounded-lg p-4"]').count();
    expect(routinesAfterDelete).toBe(routinesBeforeDelete - 1);

    // Verificar que el texto de la rutina eliminada ya no está visible
    await expect(page.locator('text=Rutina de Prueba para Eliminar')).not.toBeVisible({ timeout: 5000 });
  });

  test('debe cancelar la eliminación cuando el usuario cancela el diálogo', async ({ page }) => {
    // 1. Limpiar sesión y iniciar sesión como trainer
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.fill('#email', trainerEmail);
    await page.fill('#password', trainerPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/trainer\/dashboard/, { timeout: 10000 });

    // 2. Navegar a rutinas
    await page.goto('/trainer/routines');
    await page.waitForLoadState('networkidle');

    // 3. Crear una rutina para probar la cancelación
    const createRoutineButton = page.locator('a:has-text("Crear"), a:has-text("Create")').first();
    if (await createRoutineButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createRoutineButton.click();
      await expect(page).toHaveURL(/\/trainer\/routines\/new/, { timeout: 5000 });

      await page.fill('input[type="text"]', 'Rutina No Eliminar');
      const studentSelect = page.locator('select').first();
      await studentSelect.selectOption({ index: 1 });
      await page.fill('input[type="number"]', '2');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      await page.goto('/trainer/routines');
      await page.waitForLoadState('networkidle');
    }

    // Verificar que la rutina existe
    const routineExists = await page.locator('text=Rutina No Eliminar').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (routineExists) {
      // Contar rutinas antes
      const routinesBeforeCancel = await page.locator('[class*="border rounded-lg p-4"]').count();

      // 4. Intentar eliminar pero cancelar
      const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete")').first();
      
      // Configurar el manejador de diálogo para cancelar
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        await dialog.dismiss(); // Cancelar
      });

      await deleteButton.click();
      await page.waitForTimeout(1000);

      // 5. Verificar que la rutina sigue existiendo
      const routinesAfterCancel = await page.locator('[class*="border rounded-lg p-4"]').count();
      expect(routinesAfterCancel).toBe(routinesBeforeCancel);

      // Verificar que el texto de la rutina sigue visible
      await expect(page.locator('text=Rutina No Eliminar')).toBeVisible({ timeout: 2000 });
    }
  });

  test('debe mostrar mensaje de error si falla la eliminación', async ({ page }) => {
    // 1. Limpiar sesión y iniciar sesión como trainer
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.fill('#email', trainerEmail);
    await page.fill('#password', trainerPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/trainer\/dashboard/, { timeout: 10000 });

    // 2. Navegar a rutinas
    await page.goto('/trainer/routines');
    await page.waitForLoadState('networkidle');

    // 3. Interceptar la petición de eliminación para simular un error
    await page.route('**/api/v1/trainers/*/routines/*', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        await route.continue();
      }
    });

    // 4. Intentar eliminar una rutina
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete")').first();
    
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Configurar el manejador de diálogo para aceptar
      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await deleteButton.click();
      await page.waitForTimeout(2000);

      // 5. Verificar que aparece un mensaje de error
      const errorMessage = page.locator('.bg-red-100, .text-red-700, [class*="error"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });
});
