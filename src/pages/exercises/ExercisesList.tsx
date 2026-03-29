import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exercisesApi, Exercise, MuscleGroup } from '../../api/exercises'
import { usersApi } from '../../api/users'
import { useAuthStore } from '../../store/authStore'
import { Plus, Search } from 'lucide-react'

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

export default function ExercisesList() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createYoutubeUrl, setCreateYoutubeUrl] = useState('')
  const [createThumbnailUrl, setCreateThumbnailUrl] = useState('')
  const [createNameKey, setCreateNameKey] = useState('')
  const [createDescriptionKey, setCreateDescriptionKey] = useState('')
  const [createDifficulty, setCreateDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(
    'BEGINNER'
  )
  const [createEquipment, setCreateEquipment] = useState('')
  const [createMuscleGroups, setCreateMuscleGroups] = useState<MuscleGroup[]>([
    { group: 'CHEST', groupKey: 'muscle_groups.chest', impactPercentage: 100 },
  ])
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadExercises = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const trainerId =
        user.role === 'TRAINER' ? user.id : (await usersApi.getStudent(user.id)).trainerId
      const data = await exercisesApi.list(trainerId)
      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  const canCreate = user?.role === 'TRAINER'

  const openCreate = () => {
    if (!canCreate) return
    setCreateError('')
    setCreateName('')
    setCreateYoutubeUrl('')
    setCreateThumbnailUrl('')
    setCreateNameKey('')
    setCreateDescriptionKey('')
    setCreateDifficulty('BEGINNER')
    setCreateEquipment('')
    setCreateMuscleGroups([{ group: 'CHEST', groupKey: 'muscle_groups.chest', impactPercentage: 100 }])
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    if (isCreating) return
    setIsCreateOpen(false)
  }

  const totalImpact = useMemo(
    () => createMuscleGroups.reduce((sum, mg) => sum + (Number.isFinite(mg.impactPercentage) ? mg.impactPercentage : 0), 0),
    [createMuscleGroups]
  )

  const addMuscleGroupRow = () => {
    const firstOption = MUSCLE_GROUP_OPTIONS[0]
    setCreateMuscleGroups((prev) => [
      ...prev,
      { group: firstOption.value, groupKey: firstOption.key, impactPercentage: 0 },
    ])
  }

  const removeMuscleGroupRow = (index: number) => {
    setCreateMuscleGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMuscleGroup = (index: number, next: Partial<MuscleGroup>) => {
    setCreateMuscleGroups((prev) =>
      prev.map((mg, i) => {
        if (i !== index) return mg
        return { ...mg, ...next }
      })
    )
  }

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== 'TRAINER') return

    setIsCreating(true)
    setCreateError('')

    try {
      const normalizedMuscleGroups = createMuscleGroups
        .map((mg) => ({
          ...mg,
          impactPercentage: Number(mg.impactPercentage),
        }))
        .filter((mg) => Boolean(mg.group) && Boolean(mg.groupKey) && Number.isFinite(mg.impactPercentage))

      if (normalizedMuscleGroups.length === 0) {
        setCreateError('Tenés que agregar al menos un grupo muscular.')
        setIsCreating(false)
        return
      }

      const normalizedTotal = normalizedMuscleGroups.reduce((sum, mg) => sum + mg.impactPercentage, 0)
      if (normalizedTotal !== 100) {
        setCreateError('El impacto total de grupos musculares tiene que sumar 100%.')
        setIsCreating(false)
        return
      }

      const equipment = createEquipment
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

      await exercisesApi.create({
        name: createName,
        nameKey: createNameKey,
        descriptionKey: createDescriptionKey,
        youtubeUrl: createYoutubeUrl,
        thumbnailUrl: createThumbnailUrl || undefined,
        muscleGroups: normalizedMuscleGroups,
        difficulty: createDifficulty,
        equipment,
        trainerId: user.id,
      })

      setIsCreateOpen(false)
      await loadExercises()
    } catch (error) {
      console.error('Failed to create exercise:', error)
      setCreateError('No se pudo crear el ejercicio. Revisá los campos y volvé a intentar.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('exercises.title')}</h1>
        {canCreate && (
          <button onClick={openCreate} className="btn btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span>{t('exercises.create_exercise')}</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredExercises.map((exercise) => (
            <Link
              key={exercise.id}
              to={`/exercises/${exercise.id}/edit`}
              className="card hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                {exercise.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {exercise.descriptionKey || 'Sin descripción'}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {exercise.muscleGroups.slice(0, 3).map((mg) => (
                  <span
                    key={mg.group}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
                  >
                    {mg.group}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded w-fit">
                  {exercise.difficulty}
                </span>
                <span className="truncate">
                  {exercise.equipment.length > 0 ? exercise.equipment[0] : 'Sin equipamiento'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md sm:max-w-lg rounded-lg bg-white shadow-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-semibold">{t('exercises.create_exercise')}</h3>
              <button onClick={closeCreate} className="btn btn-secondary w-full sm:w-auto">
                {t('common.cancel')}
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('exercises.name')}
                </label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('exercises.name_key')}
                </label>
                <input
                  value={createNameKey}
                  onChange={(e) => setCreateNameKey(e.target.value)}
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
                  value={createDescriptionKey}
                  onChange={(e) => setCreateDescriptionKey(e.target.value)}
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
                  value={createYoutubeUrl}
                  onChange={(e) => setCreateYoutubeUrl(e.target.value)}
                  className="input"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('exercises.thumbnail_url')}
                </label>
                <input
                  value={createThumbnailUrl}
                  onChange={(e) => setCreateThumbnailUrl(e.target.value)}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('exercises.muscle_groups')}
                  </label>
                  <button type="button" onClick={addMuscleGroupRow} className="btn btn-secondary w-full sm:w-auto">
                    {t('exercises.add_muscle_group')}
                  </button>
                </div>

                <div className="space-y-2">
                  {createMuscleGroups.map((mg, index) => (
                    <div key={`${mg.group}-${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-7">
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

                      <div className="sm:col-span-3">
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

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeMuscleGroupRow(index)}
                          className="btn btn-secondary w-full sm:w-auto"
                          disabled={createMuscleGroups.length === 1}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('exercises.difficulty')}
                  </label>
                  <select
                    value={createDifficulty}
                    onChange={(e) =>
                      setCreateDifficulty(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')
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
                    value={createEquipment}
                    onChange={(e) => setCreateEquipment(e.target.value)}
                    className="input"
                    placeholder="barbell, bench"
                  />
                </div>
              </div>

              <button type="submit" disabled={isCreating} className="w-full btn btn-primary">
                {isCreating ? t('common.loading') : t('common.create')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}