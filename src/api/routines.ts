import axios from 'axios'
import { API_CONFIG } from '../config'

export interface Routine {
  id: string
  name: string
  trainerId: string
  description: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  weekCount: number
  createdAt: string
  updatedAt: string
}

export interface RoutineAssignment {
  id: string
  routineId: string
  studentId: string
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface AssignmentWithRoutine {
  assignment: RoutineAssignment
  routine: Routine
}

export interface WorkoutDay {
  routineId: string
  weekNumber: number
  dayNumber: number
  dayName: string
  isRestDay: boolean
  exercises: ExerciseSet[]
}

export interface ExerciseSet {
  exerciseId: string
  order: number
  sets: number
  reps: string
  restSeconds: number
  notes: string
  tempo: string
  rpe: number
}

export interface CreateRoutineRequest {
  name: string
  weekCount: number
  description: string
}

export interface UpdateRoutineRequest {
  name?: string
  description?: string
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
}

export interface CreateWorkoutDayRequest {
  weekNumber: number
  dayNumber: number
  dayName: string
  isRestDay: boolean
  exercises: ExerciseSet[]
}

const routinesApi = {
  // Trainer operations
  createRoutine: async (trainerId: string, routine: CreateRoutineRequest): Promise<Routine> => {
    const response = await axios.post(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines`, routine)
    return response.data.data
  },

  updateRoutine: async (trainerId: string, routineId: string, routine: UpdateRoutineRequest): Promise<Routine> => {
    const response = await axios.put(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines/${routineId}`, routine)
    return response.data.data
  },

  deleteRoutine: async (trainerId: string, routineId: string): Promise<void> => {
    await axios.delete(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines/${routineId}`)
  },

  listRoutinesByTrainer: async (trainerId: string, startKey?: string): Promise<{ routines: Routine[]; nextKey?: string }> => {
    const params = startKey ? { startKey } : {}
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines`, { params })
    return {
      routines: response.data.data,
      nextKey: response.data.nextKey
    }
  },

  // Student operations - now returns assignments with routine data
  listAssignmentsByStudent: async (studentId: string): Promise<AssignmentWithRoutine[]> => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/students/${studentId}/routines`)
    return response.data.data
  },

  getActiveAssignmentForStudent: async (studentId: string): Promise<{ assignment: RoutineAssignment; routine: Routine; workoutDays: WorkoutDay[] } | null> => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/students/${studentId}/routines/active`)
    if (!response.data.assignment) {
      return null
    }
    return {
      assignment: response.data.assignment,
      routine: response.data.routine,
      workoutDays: response.data.workoutDays || []
    }
  },

  // General operations
  getRoutine: async (routineId: string): Promise<{ routine: Routine; workoutDays: WorkoutDay[] }> => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/routines/${routineId}`)
    return {
      routine: response.data.data,
      workoutDays: response.data.workoutDays || []
    }
  },

  // Workout day operations
  createWorkoutDay: async (trainerId: string, routineId: string, workoutDay: CreateWorkoutDayRequest): Promise<WorkoutDay> => {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines/${routineId}/workout-days`,
      workoutDay
    )
    return response.data.data
  },

  getWorkoutDays: async (routineId: string): Promise<WorkoutDay[]> => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/routines/${routineId}/workout-days`)
    return response.data.data
  },

  updateWorkoutDay: async (trainerId: string, routineId: string, weekNumber: number, dayNumber: number, workoutDay: CreateWorkoutDayRequest): Promise<WorkoutDay> => {
    const response = await axios.put(
      `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines/${routineId}/workout-days/${weekNumber}/${dayNumber}`,
      workoutDay
    )
    return response.data.data
  },

  // Assign routine to student
  assignRoutine: async (trainerId: string, routineId: string, studentId: string): Promise<Routine> => {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/trainers/${trainerId}/routines/assign`,
      { routineId, studentId }
    )
    return response.data.data
  }
}

export default routinesApi
