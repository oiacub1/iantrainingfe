import { test, expect } from '@playwright/test'

test.describe('Routine Full Flow: Create → View → Edit → View', () => {
  const trainerEmail = `trainer-flow-${Date.now()}@test.com`
  const trainerPassword = 'password123'
  const studentEmail = `student-flow-${Date.now()}@test.com`
  const studentPassword = 'password123'
  
  let routineId: string
  let exerciseId: string

  test.beforeAll(async ({ request }) => {
    // Register trainer
    const trainerResponse = await request.post('http://localhost:8080/api/v1/auth/register', {
      data: {
        name: 'Test Trainer Flow',
        email: trainerEmail,
        password: trainerPassword,
        role: 'TRAINER'
      }
    })
    const trainerData = await trainerResponse.json()
    const trainerId = trainerData.user.id
    const trainerToken = trainerData.accessToken

    // Register student
    await request.post('http://localhost:8080/api/v1/auth/register', {
      data: {
        name: 'Test Student Flow',
        email: studentEmail,
        password: studentPassword,
        role: 'STUDENT'
      }
    })

    // Assign student to trainer
    await request.post(`http://localhost:8080/api/v1/trainers/${trainerId}/students/assign-by-email`, {
      headers: {
        'Authorization': `Bearer ${trainerToken}`
      },
      data: {
        email: studentEmail
      }
    })

    // Create an exercise for the routine
    const exerciseResponse = await request.post('http://localhost:8080/api/v1/exercises', {
      headers: {
        'Authorization': `Bearer ${trainerToken}`
      },
      data: {
        name: 'Test Exercise',
        nameKey: 'test.exercise',
        descriptionKey: 'test.exercise.description',
        youtubeUrl: 'https://youtube.com/test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        muscleGroups: [
          { name: 'CHEST', impactPercentage: 80 },
          { name: 'TRICEPS', impactPercentage: 20 }
        ],
        difficulty: 'INTERMEDIATE',
        equipment: ['BARBELL', 'BENCH'],
        trainerId: trainerId
      }
    })
    const exerciseData = await exerciseResponse.json()
    exerciseId = exerciseData.exerciseId
  })

  test('1. Create new routine template successfully', async ({ page, request }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/trainer/dashboard')
    
    const trainerResponse = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: trainerEmail,
        password: trainerPassword
      }
    })
    const trainerData = await trainerResponse.json()
    const trainerId = trainerData.user.id
    const trainerToken = trainerData.accessToken

    // Navigate to routines page
    await page.goto('http://localhost:5173/trainer/routines')
    await page.waitForLoadState('networkidle')

    // Click create routine button
    await page.click('a[href="/trainer/routines/new"]')
    await page.waitForURL('**/trainer/routines/new')
    await page.waitForLoadState('networkidle')

    // Fill routine basic info (NO student selector anymore)
    await page.fill('input[name="name"]', 'Full Flow Test Routine')
    await page.fill('textarea[name="description"]', 'Test routine description')
    await page.fill('input[type="number"][min="1"][max="52"]', '4')

    // Add a workout day
    await page.click('button:has-text("Agregar día"), button:has-text("Add day")')
    const dayNameInput = page.locator('input[name="dayName"]').first()
    await dayNameInput.fill('Chest Day')

    // Add an exercise to the workout day
    await page.click('button:has-text("Agregar ejercicio"), button:has-text("Add exercise")')
    
    // Select the exercise
    await page.selectOption('select[name="exerciseId"]', { index: 1 })
    
    // Fill exercise details
    const setsInput = page.locator('input[name="sets"]').first()
    await setsInput.fill('4')
    
    const repsInput = page.locator('input[name="reps"]').first()
    await repsInput.fill('12')
    
    const restInput = page.locator('input[name="restSeconds"]').first()
    await restInput.fill('90')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to routine detail page
    await page.waitForURL('**/routines/**')
    
    // Extract routine ID from URL
    const url = page.url()
    const match = url.match(/\/routines\/([^\/]+)$/)
    if (match) {
      routineId = match[1]
    }

    // Verify routine template was created
    await expect(page.locator('h2:has-text("Full Flow Test Routine")')).toBeVisible()
    await expect(page.locator('text=Borrador, text=Draft')).toBeVisible()
    
    // Now assign the routine to a student via API
    const studentResponse = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: {
        email: studentEmail,
        password: studentPassword
      }
    })
    const studentData = await studentResponse.json()
    const studentId = studentData.user.id
    
    await request.post(`http://localhost:8080/api/v1/trainers/${trainerId}/routines/assign`, {
      headers: {
        'Authorization': `Bearer ${trainerToken}`
      },
      data: {
        routineId: routineId,
        studentId: studentId
      }
    })
  })

  test('2. View the created routine successfully', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/trainer/dashboard')

    // Navigate directly to routine detail
    await page.goto(`http://localhost:5173/routines/${routineId}`)
    await page.waitForLoadState('networkidle')

    // Verify routine details are displayed
    await expect(page.locator('h2:has-text("Full Flow Test Routine")')).toBeVisible()
    await expect(page.locator('text=4')).toBeVisible() // Week count
    await expect(page.locator('text=Borrador, text=Draft')).toBeVisible() // Status
    
    // Verify workout day is displayed
    await expect(page.locator('text=Chest Day, text=Semana 1, text=Week 1')).toBeVisible()
  })

  test('3. Edit the routine successfully', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/trainer/dashboard')

    // Navigate to edit page
    await page.goto(`http://localhost:5173/routines/${routineId}/edit`)
    await page.waitForLoadState('networkidle')

    // Verify form is pre-populated
    const nameInput = page.locator('input[type="text"]').first()
    await expect(nameInput).toHaveValue('Full Flow Test Routine')

    // Edit routine name
    await nameInput.fill('Updated Full Flow Routine')

    // Change status to ACTIVE
    await page.selectOption('select', 'ACTIVE')

    // Edit workout day name
    const dayNameInputs = page.locator('input').filter({ hasText: /^$/ })
    const chestDayInput = page.locator('input[value="Chest Day"]')
    await chestDayInput.fill('Upper Body Day')

    // Edit exercise sets
    const setsInputs = page.locator('input[type="number"][min="1"]')
    const firstSetsInput = setsInputs.first()
    await firstSetsInput.fill('5')

    // Edit reps
    const repsInputs = page.locator('input:not([type])').filter({ hasText: /^$/ })
    const firstRepsInput = repsInputs.first()
    await firstRepsInput.fill('10')

    // Submit the form
    await page.click('button[type="submit"]:has-text("Guardar"), button[type="submit"]:has-text("Save")')

    // Wait for redirect to routine detail page
    await page.waitForURL(`**/routines/${routineId}`)
    await page.waitForLoadState('networkidle')
  })

  test('4. View again to verify all changes were saved', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/trainer/dashboard')

    // Navigate to routine detail
    await page.goto(`http://localhost:5173/routines/${routineId}`)
    await page.waitForLoadState('networkidle')

    // Verify updated routine name
    await expect(page.locator('h2:has-text("Updated Full Flow Routine")')).toBeVisible()

    // Verify status changed to ACTIVE
    await expect(page.locator('text=Activa, text=Active')).toBeVisible()

    // Verify workout day name was updated
    await expect(page.locator('text=Upper Body Day')).toBeVisible()

    // Navigate back to edit to verify exercise changes
    await page.goto(`http://localhost:5173/routines/${routineId}/edit`)
    await page.waitForLoadState('networkidle')

    // Verify sets were updated to 5
    const setsInputs = page.locator('input[type="number"][min="1"]')
    const firstSetsInput = setsInputs.first()
    await expect(firstSetsInput).toHaveValue('5')

    // Verify reps were updated to 10
    const repsInputs = page.locator('input:not([type])').filter({ hasText: /^$/ })
    const firstRepsInput = repsInputs.first()
    await expect(firstRepsInput).toHaveValue('10')
  })

  test('5. Complete flow verification', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', trainerEmail)
    await page.fill('input[type="password"]', trainerPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/trainer/dashboard')

    // Go to routines list
    await page.goto('http://localhost:5173/trainer/routines')
    await page.waitForLoadState('networkidle')

    // Verify routine appears in the list with updated name
    await expect(page.locator('text=Updated Full Flow Routine')).toBeVisible()

    // Verify status badge shows ACTIVE
    const routineCard = page.locator('div:has-text("Updated Full Flow Routine")').first()
    await expect(routineCard.locator('text=Activa, text=Active')).toBeVisible()

    // Click view button
    await page.click(`a[href="/routines/${routineId}"]`)
    await page.waitForURL(`**/routines/${routineId}`)

    // Final verification of all data
    await expect(page.locator('h2:has-text("Updated Full Flow Routine")')).toBeVisible()
    await expect(page.locator('text=Activa, text=Active')).toBeVisible()
    await expect(page.locator('text=4')).toBeVisible() // Week count unchanged
    await expect(page.locator('text=Upper Body Day')).toBeVisible()
  })
})
