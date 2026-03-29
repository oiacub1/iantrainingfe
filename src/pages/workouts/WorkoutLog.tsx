import { useTranslation } from 'react-i18next'

export default function WorkoutLog() {
  const { t } = useTranslation()

  return (
    <div className="card">
      <h1 className="text-3xl font-bold mb-4">{t('workout.log_workout')}</h1>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  )
}
