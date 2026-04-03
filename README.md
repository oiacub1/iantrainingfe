# Training Platform - Frontend

React + TypeScript + Vite frontend application for the Training Platform.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **i18next** - Internationalization
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   ├── store/            # Zustand stores
│   ├── i18n/             # i18n configuration
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
└── package.json
```

## 🛠️ Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your backend URL:

```
VITE_API_URL=http://localhost:8080/api
```

## 🏃 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 🌍 Internationalization

The app supports multiple languages using i18next. Translation files are shared with the backend:

- English: `../backend/shared/i18n/en.json`
- Spanish: `../backend/shared/i18n/es.json`

Language is auto-detected from browser settings and stored in localStorage.

## 🔐 Authentication

The app uses JWT-based authentication:

1. Login at `/login`
2. Token is stored in localStorage via Zustand
3. Token is automatically added to API requests
4. Auto-logout on 401 responses

### Demo Credentials

- **Trainer**: `trainer@example.com` / any password
- **Student**: `student@example.com` / any password

## 📱 Features

### Trainer Dashboard
- View all students
- Create exercises
- Manage routines
- Track student progress

### Student Dashboard
- View current routine
- Log workouts
- Track progress
- View exercise library

## 🎨 Styling

The app uses TailwindCSS with a custom design system:

- **Primary color**: Blue (`primary-*`)
- **Mobile-first**: Responsive design
- **Dark mode**: Ready (not implemented)

### Custom Classes

```css
.btn              /* Base button */
.btn-primary      /* Primary button */
.btn-secondary    /* Secondary button */
.btn-outline      /* Outline button */
.input            /* Input field */
.card             /* Card container */
.container-app    /* Page container */
```

## 🧪 Type Safety

All API responses are typed using TypeScript interfaces:

```typescript
import { Exercise } from '@/api/exercises'
import { Student, Trainer } from '@/api/users'
```

## 📦 State Management

Using Zustand for global state:

```typescript
import { useAuthStore } from '@/store/authStore'

const { user, login, logout } = useAuthStore()
```

## 🔌 API Integration

API client is configured with:
- Auto token injection
- Auto logout on 401
- Base URL from env
- TypeScript types

```typescript
import { exercisesApi } from '@/api/exercises'

const exercises = await exercisesApi.list()
```

## 📝 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🚀 Deployment

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Keep components small and focused
4. Use i18n for all user-facing text
5. Mobile-first responsive design

## 📄 License

MIT