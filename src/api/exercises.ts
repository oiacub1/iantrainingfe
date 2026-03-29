import { apiClient } from './client'
import { API_CONFIG } from '../config'

export interface MuscleGroup {
  group: string
  groupKey: string
  impactPercentage: number
}

export interface Exercise {
  id: string
  name: string
  nameKey: string
  descriptionKey: string
  youtubeUrl: string
  thumbnailUrl: string
  muscleGroups: MuscleGroup[]
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  equipment: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateExerciseRequest {
  name: string
  nameKey: string
  descriptionKey: string
  youtubeUrl: string
  thumbnailUrl?: string
  muscleGroups: MuscleGroup[]
  difficulty: string
  equipment: string[]
  trainerId: string
}

export const exercisesApi = {
  list: async (trainerId: string) => {
    const { data } = await apiClient.get<{ data: Exercise[] }>(API_CONFIG.ENDPOINTS.EXERCISES, {
      params: { trainerId },
    })
    return data.data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<{ data: Exercise }>(API_CONFIG.ENDPOINTS.EXERCISE_BY_ID(id))
    return data.data
  },

  create: async (exercise: CreateExerciseRequest) => {
    const { data } = await apiClient.post<{ exerciseId: string }>(API_CONFIG.ENDPOINTS.EXERCISES, exercise)
    return data
  },

  update: async (id: string, exercise: Partial<Exercise>) => {
    const { data } = await apiClient.put<{ data: Exercise }>(API_CONFIG.ENDPOINTS.EXERCISE_BY_ID(id), exercise)
    return data.data
  },

  delete: async (id: string) => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.EXERCISE_BY_ID(id))
  },
}
