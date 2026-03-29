import { test, expect } from '@playwright/test'

test.describe('Edit Routine Flow', () => {
  const trainerEmail = `trainer-edit-${Date.now()}@test.com`
  const trainerPassword = 'password123'
  const studentEmail = `student-edit-${Date.now()}@test.com`
  const studentPassword = 'password123'
  
  let routineId: string

  test.beforeAll(async ({ request }) => {
    // Register trainer
    await request.post('http://localhost:8080/api/v1/auth/register', {
      data: {
        name: 'Test Trainer Edit',
        email: trainerEmail,
        password: trainerPassword,
        role: 'TRAINER'
      }
    })

    // Register student
    await request.post('http://localhost:8080/api/v1/auth/register', {
      data: {
        name: 'Test Student Edit',
        email: studentEmail,
        password: studentPassword,
        role: 'STUDENT'
      }
    })

    // Login as trainer
    const loginResponse = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: trainerEmail,
        password: trainerPassword
      }
    })
    const loginData = await loginResponse.json()
    const trainerId = loginData.user.id
    const token = loginData.accessToken

    // Assign student to trainer
    await request.post(`http://localhost:8080/api/v1/trainers/${trainerId}/students/assign-by-email`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        email: studentEmail
      }
    })

    // Get student ID
    const studentsResponse = await request.get(`http://localhost:8080/api/v1/trainers/${trainerId}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const studentsData = await studentsResponse.json()
    const studentId = studentsData.data[0].studentId

    // Create a routine
    const routineResponse = await request.post(`http://localhost:8080/api/v1/trainers/${trainerId}/routines`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: 'Test Routine for Editing',
        studentId: studentId,
        weekCount: 4
      }
    })
    const routineData = await routineResponse.json()
    routineId = routineData.data.id
  })

  test('should edit routine successfully', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/trainer/dashboard')

    // Navigate to routines
    await page.goto('http://localhost:5173/trainer/routines')
    await page.waitForLoadState('networkidle')

    // Find and click edit button for the routine
    const editButton = page.locator(`a[href="/routines/${routineId}/edit"]`).first()
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Wait for edit page to load
    await page.waitForURL(`**/routines/${routineId}/edit`)
    await page.waitForLoadState('networkidle')

    // Verify form is pre-populated
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toHaveValue('Test Routine for Editing')

    // Edit the routine name
    await nameInput.fill('Updated Routine Name')

    // Change status to ACTIVE
    await page.selectOption('select', 'ACTIVE')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to routine detail page
    await page.waitForURL(`**/routines/${routineId}`)
    await page.waitForLoadState('networkidle')

    // Verify the updated name is displayed
    await expect(page.locator('h2:has-text("Updated Routine Name")')).toBeVisible()

    // Verify the status badge shows ACTIVE
    await expect(page.locator('text=Activa').or(page.locator('text=Active'))).toBeVisible()
  })

  test('should show validation error for invalid dates', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/trainer/dashboard')

    // Navigate to edit page
    await page.goto(`http://localhost:5173/routines/${routineId}/edit`)
    await page.waitForLoadState('networkidle')

    // Set end date before start date
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const startDateInput = page.locator('input[type="date"]').first()
    const endDateInput = page.locator('input[type="date"]').last()

    await startDateInput.fill(tomorrow.toISOString().split('T')[0])
    await endDateInput.fill(today.toISOString().split('T')[0])

    // Submit the form
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Error').or(page.locator('.bg-red-100'))).toBeVisible({ timeout: 5000 })
  })

  test('should cancel edit and return to detail page', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/trainer/dashboard')

    // Navigate to edit page
    await page.goto(`http://localhost:5173/routines/${routineId}/edit`)
    await page.waitForLoadState('networkidle')

    // Click cancel button
    const cancelButton = page.locator('a:has-text("Cancel")').or(page.locator('a:has-text("Cancelar")')).first()
    await cancelButton.click()

    // Should navigate back to detail page
    await page.waitForURL(`**/routines/${routineId}`)
  })
})
