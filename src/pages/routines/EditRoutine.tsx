import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import routinesApi, { Routine, UpdateRoutineRequest, WorkoutDay, CreateWorkoutDayRequest } from '../../api/routines'
import { exercisesApi, Exercise } from '../../api/exercises'

type ExerciseSetDraft = {
  exerciseId: string
  order: number
  sets: number
  reps: string
  restSeconds: number
  notes: string
  tempo: string
  rpe: number
}

type WorkoutDayDraft = {
  weekNumber: number
  dayNumber: number
  dayName: string
  isRestDay: boolean
  exercises: ExerciseSetDraft[]
}

export default function EditRoutine() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDayDraft[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<UpdateRoutineRequest>({
    name: '',
    description: '',
    status: undefined
  })

  useEffect(() => {
    if (!id || !user) return

    let cancelled = false
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        // Load routine and workout days
        const { routine: routineData, workoutDays: days } = await routinesApi.getRoutine(id)
        if (cancelled) return
        setRoutine(routineData)
        
        // Pre-populate form with existing data
        setFormData({
          name: routineData.name,
          description: routineData.description || '',
          status: routineData.status
        })

        if (cancelled) return
        
        // Convert to draft format
        const daysDraft: WorkoutDayDraft[] = days.map(day => ({
          weekNumber: day.weekNumber,
          dayNumber: day.dayNumber,
          dayName: day.dayName,
          isRestDay: day.isRestDay,
          exercises: day.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            notes: ex.notes || '',
            tempo: ex.tempo || '',
            rpe: ex.rpe || 0
          }))
        }))
        setWorkoutDays(daysDraft)

        // Load available exercises
        const exercises = await exercisesApi.list(user.id)
        if (cancelled) return
        setAvailableExercises(exercises)
      } catch (error) {
        console.error('Failed to load routine:', error)
        if (cancelled) return
        setError(t('routines.load_error'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, user, t])

  const getExerciseLabel = (exercise: Exercise) => {
    if (!exercise.nameKey) return exercise.name
    const translated = t(exercise.nameKey)
    return translated === exercise.nameKey ? exercise.name : translated
  }

  const addWorkoutDay = () => {
    setWorkoutDays((prev) => [
      ...prev,
      {
        weekNumber: 1,
        dayNumber: 1,
        dayName: `${t('routines.day')} 1`,
        isRestDay: false,
        exercises: []
      }
    ])
  }

  const removeWorkoutDay = (index: number) => {
    setWorkoutDays((prev) => prev.filter((_, i) => i !== index))
  }

  const updateWorkoutDay = (index: number, next: Partial<WorkoutDayDraft>) => {
    setWorkoutDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...next } : d)))
  }

  const addExerciseToDay = (dayIndex: number) => {
    setWorkoutDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        return {
          ...d,
          exercises: [
            ...d.exercises,
            { 
              exerciseId: '', 
              order: d.exercises.length + 1,
              sets: 3, 
              reps: '10', 
              restSeconds: 90, 
              notes: '', 
              tempo: '', 
              rpe: 0 
            }
          ]
        }
      })
    )
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    setWorkoutDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        const newExercises = d.exercises.filter((_, ei) => ei !== exerciseIndex)
        // Reorder exercises
        return { 
          ...d, 
          exercises: newExercises.map((ex, idx) => ({ ...ex, order: idx + 1 }))
        }
      })
    )
  }

  const updateExerciseInDay = (dayIndex: number, exerciseIndex: number, next: Partial<ExerciseSetDraft>) => {
    setWorkoutDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        return {
          ...d,
          exercises: d.exercises.map((ex, ei) => (ei === exerciseIndex ? { ...ex, ...next } : ex))
        }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !routine) return

    // Verify trainer owns this routine
    if (routine.trainerId !== user.id) {
      setError(t('routines.unauthorized'))
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Update routine basic info
      const updatePayload: UpdateRoutineRequest = {}
      
      if (formData.name && formData.name !== routine.name) {
        updatePayload.name = formData.name
      }
      
      if (formData.status && formData.status !== routine.status) {
        updatePayload.status = formData.status
      }
      
      if (formData.description !== undefined && formData.description !== routine.description) {
        updatePayload.description = formData.description
      }

      if (Object.keys(updatePayload).length > 0) {
        await routinesApi.updateRoutine(user.id, id, updatePayload)
      }

      // Update workout days
      for (const day of workoutDays) {
        const workoutDayRequest: CreateWorkoutDayRequest = {
          weekNumber: day.weekNumber,
          dayNumber: day.dayNumber,
          dayName: day.dayName,
          isRestDay: day.isRestDay,
          exercises: day.isRestDay ? [] : day.exercises.map((ex, idx) => ({
            ...ex,
            order: idx + 1
          }))
        }

        await routinesApi.updateWorkoutDay(user.id, id, day.weekNumber, day.dayNumber, workoutDayRequest)
      }
      
      // Navigate back to trainer routines list
      navigate('/trainer/routines')
    } catch (error: any) {
      console.error('Failed to update routine:', error)
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError(t('routines.not_found'))
      } else if (error.response?.status === 403) {
        setError(t('routines.unauthorized'))
      } else if (error.response?.status === 400) {
        setError(t('routines.validation_error'))
      } else {
        setError(t('routines.update_error'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || t('routines.not_found')}</p>
          <Link to="/trainer/routines" className="btn btn-primary">
            {t('common.back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('routines.edit_routine')}</h1>
          <p className="text-gray-600">{routine.name}</p>
        </div>
        <Link to={`/trainer/routines`} className="btn btn-secondary">
          {t('common.cancel')}
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t('routines.basic_info')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('routines.name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('routines.status_label')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input"
                required
              >
                <option value="DRAFT">{t('routines.status.draft')}</option>
                <option value="ACTIVE">{t('routines.status.active')}</option>
                <option value="COMPLETED">{t('routines.status.completed')}</option>
                <option value="ARCHIVED">{t('routines.status.archived')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('routines.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder={t('routines.description_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Workout Days */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('routines.workout_plan')}</h2>
            <button type="button" onClick={addWorkoutDay} className="btn btn-secondary">
              {t('common.add')} {t('routines.day')}
            </button>
          </div>

          <div className="space-y-4">
            {workoutDays.map((day, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('routines.week_number')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={routine.weekCount}
                        value={day.weekNumber}
                        onChange={(e) => updateWorkoutDay(dayIndex, { weekNumber: parseInt(e.target.value) })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('routines.day_number')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={day.dayNumber}
                        onChange={(e) => updateWorkoutDay(dayIndex, { dayNumber: parseInt(e.target.value) })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('routines.day_name')}
                      </label>
                      <input
                        value={day.dayName}
                        onChange={(e) => updateWorkoutDay(dayIndex, { dayName: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <button type="button" onClick={() => removeWorkoutDay(dayIndex)} className="btn btn-danger btn-sm">
                    {t('common.remove')}
                  </button>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={day.isRestDay}
                    onChange={(e) =>
                      updateWorkoutDay(dayIndex, { isRestDay: e.target.checked, exercises: e.target.checked ? [] : day.exercises })
                    }
                  />
                  <span>{t('routines.is_rest_day')}</span>
                </label>

                {!day.isRestDay && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">{t('routines.exercises')}</p>
                      <button type="button" onClick={() => addExerciseToDay(dayIndex)} className="btn btn-secondary btn-sm">
                        {t('routines.add_exercise')}
                      </button>
                    </div>

                    {day.exercises.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('routines.add_exercises_hint')}</p>
                    ) : (
                      <div className="space-y-3">
                        {day.exercises.map((ex, exerciseIndex) => (
                          <div key={exerciseIndex} className="border-l-4 border-primary-500 pl-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                              <div className="md:col-span-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.exercise')}
                                </label>
                                <select
                                  value={ex.exerciseId}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { exerciseId: e.target.value })}
                                  className="input"
                                  required
                                >
                                  <option value="">{t('routines.select_exercise')}</option>
                                  {availableExercises.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {getExerciseLabel(option)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.sets')}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={ex.sets}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { sets: parseInt(e.target.value) })}
                                  className="input"
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.reps')}
                                </label>
                                <input
                                  value={ex.reps}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { reps: e.target.value })}
                                  className="input"
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.rest_seconds')}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={ex.restSeconds}
                                  onChange={(e) =>
                                    updateExerciseInDay(dayIndex, exerciseIndex, { restSeconds: parseInt(e.target.value) })
                                  }
                                  className="input"
                                  required
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeExerciseFromDay(dayIndex, exerciseIndex)}
                                  className="btn btn-danger btn-sm"
                                >
                                  {t('common.remove')}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                              <div className="md:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.notes')}
                                </label>
                                <input
                                  value={ex.notes}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { notes: e.target.value })}
                                  className="input"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.tempo')}
                                </label>
                                <input
                                  value={ex.tempo}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { tempo: e.target.value })}
                                  className="input"
                                  placeholder="3-0-1-0"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t('routines.rpe')}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={ex.rpe}
                                  onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { rpe: parseInt(e.target.value) })}
                                  className="input"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Link to={`/trainer/routines`} className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
