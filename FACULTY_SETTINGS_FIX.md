# Faculty Settings Update Fix

## ✅ Fixed

The faculty settings update now properly handles all fields atomically in a single transaction.

## Changes Made

### 1. Service Layer (`users.service.js`)
**Method:** `updateProfile(userId, data)`

**Now handles:**
- ✅ `name` → User table
- ✅ `phone` → User table
- ✅ `avatar` → User table
- ✅ `department` → User table
- ✅ `bio` → FacultyProfile table
- ✅ `officeLocation` → FacultyProfile table
- ✅ `specializations` → Specialization table (full replacement)

**Transaction flow:**
```javascript
prisma.$transaction(async (tx) => {
  // 1. Update User table
  await tx.user.update({ ... });
  
  // 2. Upsert FacultyProfile (if FACULTY role)
  await tx.facultyProfile.upsert({ ... });
  
  // 3. Replace Specializations
  await tx.specialization.deleteMany({ ... });
  await tx.specialization.createMany({ ... });
  
  // 4. Return updated user with all relations
  return tx.user.findUnique({ include: { ... } });
});
```

### 2. Validation (`validators.js`)
Added `officeLocation` to `updateProfileSchema`:
```javascript
officeLocation: Joi.string().optional().allow('')
```

**Validates:**
- Phone: 10-15 digits
- Bio: Max 500 characters
- Specializations: Array of non-empty strings
- Name: Min 2 characters

## How It Works

### Request Example
```json
PATCH /api/users/profile
{
  "name": "Dr. John Doe",
  "phone": "1234567890",
  "bio": "Professor of Computer Science",
  "officeLocation": "Building A, Room 301",
  "specializations": ["React", "Node.js", "TypeScript"]
}
```

### Database Updates (Atomic)

**User table:**
```sql
UPDATE "User" 
SET name = 'Dr. John Doe', 
    phone = '1234567890'
WHERE id = 6;
```

**FacultyProfile table:**
```sql
INSERT INTO "FacultyProfile" (userId, bio, officeLocation)
VALUES (6, 'Professor of Computer Science', 'Building A, Room 301')
ON CONFLICT (userId) DO UPDATE
SET bio = 'Professor of Computer Science',
    officeLocation = 'Building A, Room 301';
```

**Specialization table:**
```sql
-- Delete old
DELETE FROM "Specialization" WHERE facultyProfileId = 6;

-- Insert new
INSERT INTO "Specialization" (name, facultyProfileId)
VALUES 
  ('React', 6),
  ('Node.js', 6),
  ('TypeScript', 6);
```

## Validation Rules

### Pre-update checks:
1. ✅ Specializations must be array
2. ✅ No empty specialization strings
3. ✅ Phone must be 10-15 digits
4. ✅ User must exist
5. ✅ Faculty-specific fields only for FACULTY role

### Error responses:
- `400` - Invalid input (bad phone, empty specializations)
- `404` - User not found
- `500` - Transaction failure (auto-rollback)

## Testing Checklist

### Test 1: Update User fields
```bash
PATCH /api/users/profile
{ "name": "New Name", "phone": "9876543210" }
```
**Verify:**
- [ ] User.name updated
- [ ] User.phone updated
- [ ] Response includes updated values

### Test 2: Update Faculty fields
```bash
PATCH /api/users/profile
{ "bio": "New bio", "officeLocation": "Room 101" }
```
**Verify:**
- [ ] FacultyProfile.bio updated
- [ ] FacultyProfile.officeLocation updated
- [ ] User fields unchanged

### Test 3: Update Specializations
```bash
PATCH /api/users/profile
{ "specializations": ["AI", "ML", "DL"] }
```
**Verify:**
- [ ] Old specializations deleted
- [ ] New specializations created
- [ ] Count matches array length
- [ ] No duplicates

### Test 4: Update All Fields
```bash
PATCH /api/users/profile
{
  "name": "Dr. Smith",
  "phone": "5551234567",
  "bio": "AI Researcher",
  "officeLocation": "Lab 5",
  "specializations": ["AI", "Robotics"]
}
```
**Verify:**
- [ ] All User fields updated
- [ ] All FacultyProfile fields updated
- [ ] Specializations replaced
- [ ] Single transaction (check logs)

### Test 5: Validation Errors
```bash
# Invalid phone
{ "phone": "abc" } → 400

# Empty specialization
{ "specializations": ["AI", "", "ML"] } → 400

# Non-array specializations
{ "specializations": "AI" } → 400
```

### Test 6: Transaction Rollback
Simulate failure mid-transaction (e.g., disconnect DB after User update).
**Verify:**
- [ ] No partial updates
- [ ] User table unchanged
- [ ] FacultyProfile unchanged
- [ ] Specializations unchanged

### Test 7: Non-Faculty User
Login as STUDENT, try to update bio/officeLocation.
**Verify:**
- [ ] User fields update normally
- [ ] Faculty fields ignored (no error)
- [ ] No FacultyProfile created

## Response Format

**Success (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 6,
    "name": "Dr. John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "role": "FACULTY",
    "facultyProfile": {
      "bio": "Professor of CS",
      "officeLocation": "Building A",
      "specializations": [
        { "id": 1, "name": "React" },
        { "id": 2, "name": "Node.js" }
      ]
    }
  }
}
```

**Error (400):**
```json
{
  "message": "Phone must be 10-15 digits"
}
```

## Verification in Prisma Studio

After update, check:

1. **User table:**
   - name, phone, avatar columns updated

2. **FacultyProfile table:**
   - bio, officeLocation columns updated
   - userId matches

3. **Specialization table:**
   - Old rows deleted
   - New rows created
   - facultyProfileId = userId

## Key Features

✅ **Atomic** - All updates in single transaction
✅ **Validated** - Input validation before DB operations
✅ **Role-aware** - Faculty fields only for FACULTY users
✅ **Complete** - Returns full updated object with relations
✅ **Safe** - Auto-rollback on any failure
✅ **Clean** - No sensitive data in response

## No Schema Changes Required

The Prisma schema is correct. The issue was in the service logic, which has now been fixed.
