import { apiClient } from './client'
import { API_CONFIG } from '../config'

export interface Trainer {
  id: string
  email: string
  name: string
  phone: string
  status: string
  metadata: {
    specializations: string[]
    certifications: string[]
    bio: string
    yearsExperience: number
  }
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  email: string
  name: string
  phone: string
  trainerId: string
  status: string
  metadata: {
    goals: string[]
    injuries: string[]
    fitnessLevel: string
    weight: number
    height: number
    age: number
  }
  createdAt: string
  updatedAt: string
}

export interface TrainerStudent {
  trainerId: string
  studentId: string
  studentName: string
  studentEmail: string
  assignedAt: string
  status: string
}

export interface CreateStudentPayload {
  name: string
  email: string
  phone?: string
  trainerId: string
  fitnessLevel?: string
  goals?: string[]
}

export const usersApi = {
  createTrainer: async (trainer: Partial<Trainer>) => {
    const payload = {
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      type: 'TRAINER',
    }
    const { data } = await apiClient.post<{ userId: string }>(API_CONFIG.ENDPOINTS.USERS, payload)
    return { trainerId: data.userId }
  },

  createStudent: async (student: CreateStudentPayload) => {
    const payload = {
      name: student.name,
      email: student.email,
      phone: student.phone,
      type: 'STUDENT',
      trainerId: student.trainerId,
      fitnessLevel: student.fitnessLevel,
      goals: student.goals,
    }
    const { data } = await apiClient.post<{ userId: string }>(API_CONFIG.ENDPOINTS.USERS, payload)
    return { studentId: data.userId }
  },

  getTrainer: async (id: string) => {
    const { data } = await apiClient.get<{ data: Trainer }>(API_CONFIG.ENDPOINTS.USER_BY_ID(id), {
      params: { type: 'trainer' },
    })
    return data.data
  },

  getStudent: async (id: string) => {
    const { data } = await apiClient.get<{ data: Student }>(API_CONFIG.ENDPOINTS.USER_BY_ID(id), {
      params: { type: 'student' },
    })
    return data.data
  },

  listStudents: async (trainerId: string, limit = 20, lastKey?: string) => {
    const { data } = await apiClient.get<{ data: TrainerStudent[] }>(
      API_CONFIG.ENDPOINTS.TRAINERS_STUDENTS(trainerId),
      { params: { limit, lastKey } }
    )
    return { students: data.data || [], nextKey: undefined }
  },

  assignTrainer: async (trainerId: string, studentId: string) => {
    const { data } = await apiClient.post(API_CONFIG.ENDPOINTS.TRAINERS_STUDENTS(trainerId), {
      studentId,
    })
    return data
  },

  assignStudentByEmail: async (trainerId: string, email: string) => {
    const { data } = await apiClient.post(
      API_CONFIG.ENDPOINTS.TRAINERS_STUDENTS_ASSIGN_BY_EMAIL(trainerId),
      { email }
    )
    return data
  },
}
