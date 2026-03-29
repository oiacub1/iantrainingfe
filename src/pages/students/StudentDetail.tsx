import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { usersApi, Student } from '../../api/users'
import routinesApi, { Routine, AssignmentWithRoutine } from '../../api/routines'
import { ArrowLeft, Calendar, User, Mail, Phone, Target, AlertCircle, Dumbbell, Play } from 'lucide-react'

export default function StudentDetail() {
  const { t } = useTranslation()
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const [student, setStudent] = useState<Student | null>(null)
  const [activeAssignment, setActiveAssignment] = useState<AssignmentWithRoutine | null>(null)
  const [workoutDays, setWorkoutDays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([])
  const [selectedRoutineId, setSelectedRoutineId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState(false)

  const loadStudent = useCallback(async () => {
    if (!studentId) return
    
    setLoading(true)
    setError('')
    
    try {
      const data = await usersApi.getStudent(studentId)
      setStudent(data)
    } catch (err) {
      console.error('Failed to load student:', err)
      setError('No se pudo cargar la información del alumno')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const loadActiveAssignment = useCallback(async () => {
    if (!studentId) return
    
    try {
      const data = await routinesApi.getActiveAssignmentForStudent(studentId)
      setActiveAssignment(data)
      
      // Cargar workout days si hay una asignación activa
      if (data) {
        const workoutData = await routinesApi.getWorkoutDays(data.routine.id)
        setWorkoutDays(workoutData)
      } else {
        setWorkoutDays([])
      }
    } catch (err) {
      console.error('Failed to load active assignment:', err)
      setActiveAssignment(null)
      setWorkoutDays([])
    }
  }, [studentId])

  useEffect(() => {
    loadStudent()
    loadActiveAssignment()
  }, [loadStudent, loadActiveAssignment])

  const openAssignModal = async () => {
    if (!user) return
    
    setIsAssignModalOpen(true)
    setAssignError('')
    setAssignSuccess(false)
    setSelectedRoutineId('')
    
    try {
      const { routines } = await routinesApi.listRoutinesByTrainer(user.id)
      // En el nuevo modelo, cualquier rutina puede ser asignada (plantilla)
      setAvailableRoutines(routines)
    } catch (err) {
      console.error('Failed to load routines:', err)
      setAssignError('No se pudieron cargar las rutinas disponibles')
    }
  }

  const closeAssignModal = () => {
    if (isAssigning) return
    setIsAssignModalOpen(false)
  }

  const handleAssignRoutine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !studentId || !selectedRoutineId) return

    setIsAssigning(true)
    setAssignError('')
    setAssignSuccess(false)

    try {
      await routinesApi.assignRoutine(user.id, selectedRoutineId, studentId)
      setAssignSuccess(true)
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        setIsAssignModalOpen(false)
        // Recargar datos del estudiante y asignación activa
        loadStudent()
        loadActiveAssignment()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to assign routine:', err)
      
      if (err.response?.status === 403) {
        setAssignError('No tenés permiso para asignar esta rutina a este alumno')
      } else if (err.response?.status === 404) {
        setAssignError('Rutina o alumno no encontrado')
      } else {
        setAssignError('No se pudo asignar la rutina. Intentá nuevamente.')
      }
    } finally {
      setIsAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>
        <div className="card bg-red-50 border border-red-200">
          <p className="text-red-700">{error || 'Alumno no encontrado'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>
        
        <button onClick={openAssignModal} className="btn btn-primary flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>Asignar Rutina</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600">{t('common.student')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{t('auth.email')}</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>

            {student.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{t('common.phone')}</p>
                  <p className="font-medium">{student.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Nivel de Fitness</p>
                <p className="font-medium">{student.metadata.fitnessLevel || 'No especificado'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {student.metadata.goals && student.metadata.goals.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Objetivos</p>
                <div className="flex flex-wrap gap-2">
                  {student.metadata.goals.map((goal, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {student.metadata.injuries && student.metadata.injuries.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Lesiones</p>
                <div className="flex flex-wrap gap-2">
                  {student.metadata.injuries.map((injury, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {injury}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rutina Asignada */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Dumbbell className="w-5 h-5" />
          <span>Rutina Asignada</span>
        </h2>
        
        {activeAssignment ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{activeAssignment.routine.name}</p>
                <p className="text-sm text-gray-600">
                  {activeAssignment.routine.description || 'Sin descripción'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Inicio: {new Date(activeAssignment.assignment.startDate).toLocaleDateString()}</span>
                  <span>Fin: {new Date(activeAssignment.assignment.endDate).toLocaleDateString()}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Activa
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  to={`/routines/${activeAssignment.routine.id}/edit`}
                  className="btn btn-outline btn-sm flex items-center space-x-1"
                >
                  <Play className="w-4 h-4" />
                  <span>Editar Rutina</span>
                </Link>
              </div>
            </div>
            
            {workoutDays && workoutDays.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Días de entrenamiento esta semana</p>
                <div className="grid grid-cols-7 gap-2">
                  {workoutDays
                    .filter((day: any) => day.weekNumber === 1) // Semana 1 como ejemplo
                    .sort((a: any, b: any) => a.dayNumber - b.dayNumber)
                    .map((day: any) => (
                      <div
                        key={`${day.weekNumber}-${day.dayNumber}`}
                        className={`p-2 rounded-lg text-center text-xs ${
                          day.isRestDay 
                            ? 'bg-gray-100 text-gray-500' 
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        <p className="font-medium">{day.dayName}</p>
                        <p className="mt-1">
                          {day.isRestDay ? 'Descanso' : `${day.exercises.length} ej`}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Este estudiante no tiene una rutina asignada</p>
            <p className="text-sm text-gray-400 mt-1">
              Usá el botón "Asignar Rutina" para asignarle una rutina
            </p>
          </div>
        )}
      </div>

      {/* Modal de Asignación de Rutina */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Asignar Rutina a {student.name}</h3>
              <button onClick={closeAssignModal} className="btn btn-secondary" disabled={isAssigning}>
                {t('common.cancel')}
              </button>
            </div>

            {assignSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                ✓ Rutina asignada exitosamente
              </div>
            )}

            {assignError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{assignError}</span>
              </div>
            )}

            {availableRoutines.length === 0 ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  No tenés rutinas disponibles para asignar. Creá una rutina nueva primero.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAssignRoutine} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Rutina
                  </label>
                  <select
                    value={selectedRoutineId}
                    onChange={(e) => setSelectedRoutineId(e.target.value)}
                    className="input"
                    required
                    disabled={isAssigning}
                  >
                    <option value="">-- Seleccionar --</option>
                    {availableRoutines.map((routine) => (
                      <option key={routine.id} value={routine.id}>
                        {routine.name} ({routine.weekCount} semanas)
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isAssigning || !selectedRoutineId} 
                  className="w-full btn btn-primary"
                >
                  {isAssigning ? 'Asignando...' : 'Asignar Rutina'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
