import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { exercisesApi, Exercise, MuscleGroup } from '../../api/exercises'

const MUSCLE_GROUP_OPTIONS: Array<{ value: MuscleGroup['group']; key: string }> = [
  { value: 'QUADRICEPS', key: 'muscle_groups.quadriceps' },
  { value: 'HAMSTRINGS', key: 'muscle_groups.hamstrings' },
  { value: 'GLUTES', key: 'muscle_groups.glutes' },
  { value: 'CALVES', key: 'muscle_groups.calves' },
  { value: 'CHEST', key: 'muscle_groups.chest' },
  { value: 'BACK', key: 'muscle_groups.back' },
  { value: 'SHOULDERS', key: 'muscle_groups.shoulders' },
  { value: 'BICEPS', key: 'muscle_groups.biceps' },
  { value: 'TRICEPS', key: 'muscle_groups.triceps' },
  { value: 'FOREARMS', key: 'muscle_groups.forearms' },
  { value: 'CORE', key: 'muscle_groups.core' },
  { value: 'ABS', key: 'muscle_groups.abs' },
  { value: 'OBLIQUES', key: 'muscle_groups.obliques' },
  { value: 'LOWER_BACK', key: 'muscle_groups.lower_back' },
  { value: 'TRAPS', key: 'muscle_groups.traps' },
]

export default function EditExercise() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    nameKey: '',
    descriptionKey: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    equipment: '',
  })
  
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([
    { group: 'CHEST', groupKey: 'muscle_groups.chest', impactPercentage: 100 },
  ])

  useEffect(() => {
    if (!id || !user) return

    let cancelled = false
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        // Load exercise
        const exerciseData = await exercisesApi.getById(id)
        if (cancelled) return
        setExercise(exerciseData)
        
        // Pre-populate form with existing data
        setFormData({
          name: exerciseData.name,
          nameKey: exerciseData.nameKey,
          descriptionKey: exerciseData.descriptionKey,
          youtubeUrl: exerciseData.youtubeUrl,
          thumbnailUrl: exerciseData.thumbnailUrl || '',
          difficulty: exerciseData.difficulty,
          equipment: exerciseData.equipment.join(', '),
        })

        if (cancelled) return
        
        // Set muscle groups
        setMuscleGroups(exerciseData.muscleGroups)
      } catch (error) {
        console.error('Failed to load exercise:', error)
        if (cancelled) return
        setError(t('exercises.load_error', 'No se pudo cargar el ejercicio'))
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

  const totalImpact = muscleGroups.reduce((sum, mg) => sum + (Number.isFinite(mg.impactPercentage) ? mg.impactPercentage : 0), 0)

  const addMuscleGroupRow = () => {
    const firstOption = MUSCLE_GROUP_OPTIONS[0]
    setMuscleGroups((prev) => [
      ...prev,
      { group: firstOption.value, groupKey: firstOption.key, impactPercentage: 0 },
    ])
  }

  const removeMuscleGroupRow = (index: number) => {
    setMuscleGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMuscleGroup = (index: number, next: Partial<MuscleGroup>) => {
    setMuscleGroups((prev) =>
      prev.map((mg, i) => {
        if (i !== index) return mg
        return { ...mg, ...next }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !exercise) return

    // Verify trainer owns this exercise
    if (exercise.createdBy !== user.id) {
      setError(t('exercises.unauthorized', 'No tenés permiso para editar este ejercicio'))
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Normalize muscle groups
      const normalizedMuscleGroups = muscleGroups
        .map((mg) => ({
          ...mg,
          impactPercentage: Number(mg.impactPercentage),
        }))
        .filter((mg) => Boolean(mg.group) && Boolean(mg.groupKey) && Number.isFinite(mg.impactPercentage))

      if (normalizedMuscleGroups.length === 0) {
        setError(t('exercises.muscle_groups_required', 'Tenés que agregar al menos un grupo muscular.'))
        setIsSubmitting(false)
        return
      }

      const normalizedTotal = normalizedMuscleGroups.reduce((sum, mg) => sum + mg.impactPercentage, 0)
      if (normalizedTotal !== 100) {
        setError(t('exercises.total_impact_100', 'El impacto total de grupos musculares tiene que sumar 100%.'))
        setIsSubmitting(false)
        return
      }

      // Normalize equipment
      const equipment = formData.equipment
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

      // Prepare update payload
      const updatePayload: Partial<Exercise> = {}
      
      if (formData.name !== exercise.name) {
        updatePayload.name = formData.name
      }
      
      if (formData.nameKey !== exercise.nameKey) {
        updatePayload.nameKey = formData.nameKey
      }
      
      if (formData.descriptionKey !== exercise.descriptionKey) {
        updatePayload.descriptionKey = formData.descriptionKey
      }
      
      if (formData.youtubeUrl !== exercise.youtubeUrl) {
        updatePayload.youtubeUrl = formData.youtubeUrl
      }
      
      if (formData.thumbnailUrl !== (exercise.thumbnailUrl || '')) {
        updatePayload.thumbnailUrl = formData.thumbnailUrl || undefined
      }
      
      if (formData.difficulty !== exercise.difficulty) {
        updatePayload.difficulty = formData.difficulty
      }
      
      // Compare equipment arrays
      const currentEquipment = exercise.equipment || []
      const newEquipment = equipment
      const equipmentChanged = 
        currentEquipment.length !== newEquipment.length ||
        currentEquipment.some((eq, idx) => eq !== newEquipment[idx])
      
      if (equipmentChanged) {
        updatePayload.equipment = equipment
      }
      
      // Compare muscle groups
      const currentMuscleGroups = exercise.muscleGroups || []
      const muscleGroupsChanged = 
        currentMuscleGroups.length !== normalizedMuscleGroups.length ||
        currentMuscleGroups.some((mg, idx) => 
          mg.group !== normalizedMuscleGroups[idx].group ||
          mg.groupKey !== normalizedMuscleGroups[idx].groupKey ||
          mg.impactPercentage !== normalizedMuscleGroups[idx].impactPercentage
        )
      
      if (muscleGroupsChanged) {
        updatePayload.muscleGroups = normalizedMuscleGroups
      }

      // Only update if there are changes
      if (Object.keys(updatePayload).length > 0) {
        await exercisesApi.update(id, updatePayload)
      }
      
      // Navigate back to exercises list
      navigate('/exercises')
    } catch (error: any) {
      console.error('Failed to update exercise:', error)
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError(t('exercises.not_found', 'Ejercicio no encontrado'))
      } else if (error.response?.status === 403) {
        setError(t('exercises.unauthorized', 'No tenés permiso para editar este ejercicio'))
      } else if (error.response?.status === 400) {
        setError(t('exercises.validation_error', 'Error de validación. Revisá los campos.'))
      } else {
        setError(t('exercises.update_error', 'No se pudo actualizar el ejercicio. Intentá de nuevo.'))
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

  if (!exercise) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || t('exercises.not_found', 'Ejercicio no encontrado')}</p>
          <Link to="/exercises" className="btn btn-primary">
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
          <h1 className="text-3xl font-bold text-gray-900">{t('exercises.edit_exercise', 'Editar Ejercicio')}</h1>
          <p className="text-gray-600">{exercise.name}</p>
        </div>
        <Link to="/exercises" className="btn btn-secondary">
          {t('common.cancel')}
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t('exercises.basic_info', 'Información Básica')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.name')}
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
                {t('exercises.name_key')}
              </label>
              <input
                type="text"
                value={formData.nameKey}
                onChange={(e) => setFormData({ ...formData, nameKey: e.target.value })}
                className="input"
                placeholder="exercises.squat.name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.description_key')}
              </label>
              <input
                type="text"
                value={formData.descriptionKey}
                onChange={(e) => setFormData({ ...formData, descriptionKey: e.target.value })}
                className="input"
                placeholder="exercises.squat.description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.video_url')}
              </label>
              <input
                type="text"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className="input"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.thumbnail_url')}
              </label>
              <input
                type="text"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Muscle Groups */}
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('exercises.muscle_groups')}</h2>
              <button type="button" onClick={addMuscleGroupRow} className="btn btn-secondary">
                {t('exercises.add_muscle_group')}
              </button>
            </div>

            <div className="space-y-2">
              {muscleGroups.map((mg, index) => (
                <div key={`${mg.group}-${index}`} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <select
                      value={mg.group}
                      onChange={(e) => {
                        const option = MUSCLE_GROUP_OPTIONS.find((o) => o.value === e.target.value)
                        if (!option) return
                        updateMuscleGroup(index, { group: option.value, groupKey: option.key })
                      }}
                      className="input"
                    >
                      {MUSCLE_GROUP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {t(o.key)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={mg.impactPercentage}
                      onChange={(e) => updateMuscleGroup(index, { impactPercentage: Number(e.target.value) })}
                      className="input"
                      aria-label={t('exercises.impact_percentage')}
                    />
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMuscleGroupRow(index)}
                      className="btn btn-secondary"
                      disabled={muscleGroups.length === 1}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>{t('exercises.total_impact')}</span>
              <span className={totalImpact === 100 ? 'text-green-600' : 'text-red-600'}>
                {totalImpact}%
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty and Equipment */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t('exercises.details', 'Detalles')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.difficulty')}
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })
                }
                className="input"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('exercises.equipment')}
              </label>
              <input
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                className="input"
                placeholder="barbell, bench"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Link to="/exercises" className="btn btn-secondary">
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