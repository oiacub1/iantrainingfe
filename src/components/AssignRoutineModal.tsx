import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, X } from 'lucide-react'
import routinesApi, { Routine } from '../api/routines'
import { usersApi, TrainerStudent } from '../api/users'

interface AssignRoutineModalProps {
  routineId: string
  trainerId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AssignRoutineModal({ routineId, trainerId, onClose, onSuccess }: AssignRoutineModalProps) {
  const { t } = useTranslation()
  const [students, setStudents] = useState<TrainerStudent[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await usersApi.listStudents(trainerId)
        setStudents(data.students)
        
        // Set default dates
        const today = new Date()
        const nextMonth = new Date(today)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        
        setStartDate(today.toISOString().split('T')[0])
        setEndDate(nextMonth.toISOString().split('T')[0])
      } catch (err) {
        console.error('Failed to load students:', err)
        setError(t('students.load_error'))
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [trainerId, t])

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedStudentIds.length === 0) {
      setError('Seleccioná al menos un estudiante')
      return
    }

    setIsAssigning(true)
    setError('')
    setSuccess(false)

    try {
      // Asignar rutina a cada estudiante seleccionado
      for (const studentId of selectedStudentIds) {
        await routinesApi.assignRoutine(trainerId, routineId, studentId)
      }
      
      setSuccess(true)
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to assign routine:', err)
      
      if (err.response?.status === 403) {
        setError('No tenés permiso para asignar esta rutina')
      } else if (err.response?.status === 404) {
        setError('Rutina o estudiante no encontrado')
      } else if (err.response?.status === 409) {
        setError('Uno o más estudiantes ya tienen una rutina activa')
      } else {
        setError('No se pudo asignar la rutina. Intentá nuevamente.')
      }
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Asignar Rutina a Estudiantes</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isAssigning}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            ✓ Rutina asignada exitosamente a {selectedStudentIds.length} estudiante(s)
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              No tenés estudiantes asignados. Agregá estudiantes primero.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleccionar Estudiantes ({selectedStudentIds.length} seleccionados)
              </label>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {students.map((student) => (
                  <label
                    key={student.studentId}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.studentId)}
                      onChange={() => toggleStudent(student.studentId)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      disabled={isAssigning}
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{student.studentName}</p>
                      <p className="text-sm text-gray-500">{student.studentEmail}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                  required
                  disabled={isAssigning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                  required
                  disabled={isAssigning}
                  min={startDate}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isAssigning}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isAssigning || selectedStudentIds.length === 0}
                className="btn btn-primary"
              >
                {isAssigning 
                  ? 'Asignando...' 
                  : `Asignar a ${selectedStudentIds.length} estudiante(s)`
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
