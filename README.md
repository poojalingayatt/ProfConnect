# ProfConnect

A full-stack academic appointment booking platform featuring real-time notifications, role-based access control, booking conflict detection, rescheduling workflows, and a review system.

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- React Query for state management
- Socket.IO client for real-time communication
- Tailwind CSS with shadcn/ui components
- React Router v6
- Axios

**Backend:**
- Node.js with Express.js
- PostgreSQL with Prisma ORM
- Socket.IO for real-time notifications
- JWT authentication

## Features

- 🔐 **JWT Authentication** - Secure role-based login (Student/Faculty)
- 👥 **Faculty Discovery** - Search, filter, and follow faculty members
- 📅 **Booking Engine** - Real-time availability checking with conflict detection
- ⚡ **Real-time Notifications** - Instant WebSocket-based notifications
- 🔄 **Rescheduling Workflow** - Approval-based appointment rescheduling
- ⭐ **Review System** - 5-star rating with backend-aggregated reputation
- 📱 **Responsive Design** - Mobile-first UI with shadcn/ui components

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL database
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create .env file with required variables

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env file with VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/profconnect
JWT_SECRET=your-jwt-secret
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000/api
```

## Architecture

The system follows a clean architecture pattern with:

- **Backend as single source of truth**
- **REST API for initial data fetching**
- **React Query for client-side caching**
- **Socket.IO for real-time event streaming**
- **Strict appointment state machine**
- **Write-once review system**

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architectural documentation.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT