# ProfConnect Architecture

## System Overview

ProfConnect is a full-stack academic appointment booking platform featuring real-time notifications, role-based access control, booking conflict detection, rescheduling workflows, and a review system.

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui components
- React Query for state management
- Socket.IO Client for real-time notifications

**Backend:**
- Node.js with Express
- PostgreSQL database
- Prisma ORM
- Socket.IO for real-time communication
- JWT for authentication

## Key Architectural Decisions

### 1. Backend as Single Source of Truth
All data originates from and is validated by the backend. The frontend never generates or fakes data - it only transforms backend data for UI presentation.

### 2. Hybrid State Management Strategy
- **REST API**: Used for initial data fetching and state synchronization
- **Socket.IO**: Used for real-time event streaming (notifications, status updates)
- **React Query**: Manages client-side caching and provides optimistic updates

### 3. Appointment State Machine
Appointments follow a strict state transition model:
```
PENDING → ACCEPTED → COMPLETED
PENDING → REJECTED
PENDING/ACCEPTED → CANCELLED
ACCEPTED → RESCHEDULE_REQUESTED → ACCEPTED
```

### 4. Write-Once Review Model
Reviews can only be submitted once per completed appointment, ensuring data integrity and preventing manipulation.

### 5. Database-Level Conflict Prevention
Unique constraints on `(facultyId, date, slot)` prevent double-booking at the database level.

## Core Features

### Authentication & Authorization
- JWT-based authentication with role-based access control
- Session restoration on page reload
- Protected routes for student/faculty roles
- Proper logout with socket disconnection and cache clearing

### Faculty Discovery
- Search and filter faculty by name, department, availability
- Follow/unfollow functionality with real-time state synchronization
- Faculty profile viewing with ratings and reviews

### Booking Engine
- Real-time availability checking
- Conflict detection with precise error handling
- Slot-based booking system
- Automatic cache invalidation on booking changes

### Appointment Management
- Role-specific appointment views
- Status-based filtering and actions
- Accept/reject functionality for faculty
- Cancel functionality for both roles

### Rescheduling Workflow
- Request-based rescheduling system
- Faculty approval required for reschedule requests
- Conflict detection in new time slots
- Status transition: ACCEPTED → RESCHEDULE_REQUESTED → ACCEPTED

### Review & Rating System
- Post-appointment review submission
- Star rating (1-5) with optional comments
- Backend-aggregated faculty ratings
- Review history tracking

### Real-time Notifications
- Socket.IO based notification system
- Type-safe notification events
- Read/unread status tracking
- Cross-tab notification synchronization

## Data Flow Patterns

### 1. Initial Load Pattern
```
Component Mount → React Query Fetch → API Call → Backend Validation → Database Query → Response Transform → UI Render
```

### 2. Real-time Update Pattern
```
Backend Event → Socket.IO Emit → Client Listener → React Query Cache Update → UI Re-render
```

### 3. Optimistic Update Pattern
```
User Action → Optimistic UI Update → API Call → Success: Confirm Update | Error: Rollback UI
```

## Security Considerations

### Authentication Flow
1. User credentials validated against database
2. JWT token generated with user claims
3. Token stored in secure HTTP-only cookie
4. Token validated on each authenticated request
5. Proper token expiration and refresh handling

### Authorization
- Role-based route protection
- API endpoint authorization checks
- Resource ownership validation
- Prevent cross-role data access

### Data Validation
- Input validation at API layer
- Database constraints for data integrity
- Type-safe TypeScript interfaces
- Prisma schema validation

## Performance Optimizations

### Frontend
- Code splitting with React.lazy
- React Query caching and background updates
- Memoization of expensive computations
- Efficient re-rendering with React.memo
- Bundle size optimization with Vite

### Backend
- Database indexing on frequently queried fields
- Connection pooling for database efficiency
- HTTP response compression
- Efficient query patterns with Prisma

### Database
- Proper indexing strategy
- Connection pooling configuration
- Query optimization through Prisma
- Regular maintenance and monitoring

## Error Handling Strategy

### Frontend
- Centralized error boundary components
- User-friendly error messages
- Graceful degradation for failed operations
- Retry mechanisms for transient failures

### Backend
- Structured error responses
- HTTP status code consistency
- Detailed logging for debugging
- Proper error propagation

## Deployment Considerations

### Environment Configuration
- Separate environment files for development/production
- Environment-specific database connections
- Secure secret management
- CORS configuration for frontend-backend communication

### Scalability
- Stateless backend design
- Horizontal scaling capability
- Load balancing considerations
- Database connection management

## Future Enhancement Areas

1. **Caching Layer**: Redis for session storage and API response caching
2. **Rate Limiting**: API rate limiting to prevent abuse
3. **Analytics**: Usage analytics and reporting
4. **Mobile Support**: Progressive Web App capabilities
5. **Advanced Search**: Full-text search for faculty discovery
6. **Calendar Integration**: External calendar sync capabilities

## Code Organization

### Frontend Structure
```
src/
├── api/          # API client functions
├── components/   # Reusable UI components
├── context/      # React context providers
├── hooks/        # Custom React hooks
├── lib/          # Utility functions and configuration
├── pages/        # Route components
├── types/        # TypeScript interfaces
└── App.tsx       # Main application component
```

### Backend Structure
```
src/
├── controllers/  # Request handlers
├── middleware/   # Express middleware
├── routes/       # API route definitions
├── services/     # Business logic
├── sockets/      # Socket.IO handlers
├── utils/        # Utility functions
├── config/       # Configuration files
└── app.js        # Express application setup
```

This architecture provides a solid foundation for a scalable, maintainable academic appointment booking system with real-time capabilities.