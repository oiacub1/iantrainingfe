import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import TrainerDashboard from './pages/trainer/Dashboard'
import StudentDashboard from './pages/student/Dashboard'
import ExercisesList from './pages/exercises/ExercisesList'
import ExerciseDetail from './pages/exercises/ExerciseDetail'
import EditExercise from './pages/exercises/EditExercise'
import RoutineDetail from './pages/routines/RoutineDetail'
import EditRoutine from './pages/routines/EditRoutine'
import WorkoutLog from './pages/workouts/WorkoutLog'
import TrainerRoutines from './pages/routines/TrainerRoutines'
import StudentRoutines from './pages/routines/StudentRoutines'
import StudentDetail from './pages/students/StudentDetail'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<Layout />}>
          {!isAuthenticated ? (
            <Route path="*" element={<Navigate to="/login" replace />} />
          ) : (
            <>
              <Route 
                path="/" 
                element={
                  user?.role === 'TRAINER' 
                    ? <Navigate to="/trainer/dashboard" replace />
                    : <Navigate to="/student/dashboard" replace />
                } 
              />
              
              {/* Trainer Routes */}
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/routines" element={<TrainerRoutines />} />
              <Route path="/trainer/routines/new" element={<TrainerRoutines />} />
              <Route path="/students/:studentId" element={<StudentDetail />} />
              
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/routines" element={<StudentRoutines />} />
              <Route path="/student/workout" element={<WorkoutLog />} />
              
              {/* Shared Routes */}
              <Route path="/exercises" element={<ExercisesList />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="/exercises/:id/edit" element={<EditExercise />} />
              <Route path="/routines/:id" element={<RoutineDetail />} />
              <Route path="/routines/:id/edit" element={<EditRoutine />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
