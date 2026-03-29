import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exercisesApi, Exercise } from '../../api/exercises'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ExerciseDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadExercise(id)
    }
  }, [id])

  const loadExercise = async (exerciseId: string) => {
    try {
      const data = await exercisesApi.getById(exerciseId)
      setExercise(data)
    } catch (error) {
      console.error('Failed to load exercise:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p className="text-center py-8">{t('common.loading')}</p>
  }

  if (!exercise) {
    return <p className="text-center py-8">{t('exercises.not_found', 'Ejercicio no encontrado')}</p>
  }

  return (
    <div className="space-y-6">
      <Link to="/exercises" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </Link>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4">{exercise.name}</h1>
        

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">{t('exercises.description')}</h2>
            <p className="text-gray-700">{t(exercise.descriptionKey)}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">{t('exercises.muscle_groups')}</h2>
            <div className="space-y-2">
              {exercise.muscleGroups.map((mg) => (
                <div key={mg.group} className="flex items-center justify-between">
                  <span className="text-gray-700">{t(mg.groupKey)}</span>
                  <span className="font-semibold text-primary-600">{mg.impactPercentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">{t('exercises.difficulty')}</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
              {t(`difficulty.${exercise.difficulty.toLowerCase()}`)}
            </span>
          </div>

          {exercise.equipment.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">{t('exercises.equipment')}</h2>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((eq) => (
                  <span key={eq} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
