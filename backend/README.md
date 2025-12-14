# ProfConnect Backend (Phase 1)

Base URL: `http://localhost:5000/api`

Run in development:

```powershell
cd backend
npm install
npm run dev
```

Seed the database:

```powershell
npm run seed
```

Auth header: `Authorization: Bearer <token>`

Demo credentials (seeded):
- student1@proffconnect.com / Student@123
- student2@proffconnect.com / Student@123
- student3@proffconnect.com / Student@123
- faculty1@proffconnect.com / Faculty@123
- faculty2@proffconnect.com / Faculty@123
- faculty3@proffconnect.com / Faculty@123

Key endpoints (examples):

- POST /api/auth/login { email, password }
- GET /api/auth/me
- GET /api/faculty
- GET /api/faculty/:facultyId
- PATCH /api/faculty/me
- PUT /api/availability/me
- GET /api/availability/:facultyId
- POST /api/appointments
- GET /api/appointments/me
- PATCH /api/appointments/:id/accept
- PATCH /api/appointments/:id/reject
- PATCH /api/follows/:facultyId
- GET /api/notifications/me

See code for full validation and responses. All responses follow `{ success: true|false, data|message }`.
