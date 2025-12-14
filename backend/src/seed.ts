import { connectDB } from "./config/db";
import { UserModel } from "./models/User.model";
import { hashPassword } from "./utils/password";
import { FacultyProfileModel } from "./models/FacultyProfile.model";
import { AvailabilityModel } from "./models/Availability.model";
import { AppointmentModel } from "./models/Appointment.model";
import { FollowModel } from "./models/Follow.model";
import { NotificationModel } from "./models/Notification.model";

async function seed() {
  await connectDB();
  console.log("Seeding DB...");
  await Promise.all([
    UserModel.deleteMany({}),
    FacultyProfileModel.deleteMany({}),
    AvailabilityModel.deleteMany({}),
    AppointmentModel.deleteMany({}),
    FollowModel.deleteMany({}),
    NotificationModel.deleteMany({})
  ]);

  const users = [
    { name: "Student One", email: "student1@proffconnect.com", password: "Student@123", role: "student" },
    { name: "Student Two", email: "student2@proffconnect.com", password: "Student@123", role: "student" },
    { name: "Student Three", email: "student3@proffconnect.com", password: "Student@123", role: "student" },
    { name: "Faculty One", email: "faculty1@proffconnect.com", password: "Faculty@123", role: "faculty" },
    { name: "Faculty Two", email: "faculty2@proffconnect.com", password: "Faculty@123", role: "faculty" },
    { name: "Faculty Three", email: "faculty3@proffconnect.com", password: "Faculty@123", role: "faculty" }
  ];

  const created: any[] = [];
  for (const u of users) {
    const passwordHash = await hashPassword(u.password);
    const doc = await UserModel.create({ name: u.name, email: u.email, passwordHash, role: u.role });
    created.push(doc);
  }

  const facultyUsers = created.filter((u) => u.role === "faculty");
  for (const f of facultyUsers) {
    await FacultyProfileModel.create({ userId: f._id, bio: `Hello I'm ${f.name}`, qualifications: ["PhD"], specializations: ["AI"], officeLocation: "Building A" });
    await AvailabilityModel.create({ facultyId: f._id, week: Array.from({ length: 7 }).map((_, i) => ({ day: i, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }], breaks: [] })) });
  }

  const students = created.filter((u) => u.role === "student");
  // create some appointments
  const appts = [
    { student: students[0], faculty: facultyUsers[0], title: "Discuss project", dateOffset: 1, start: "09:00", end: "09:30", status: "pending" },
    { student: students[1], faculty: facultyUsers[0], title: "Thesis review", dateOffset: 2, start: "10:00", end: "10:30", status: "accepted" },
    { student: students[2], faculty: facultyUsers[1], title: "Consult", dateOffset: 3, start: "14:00", end: "14:30", status: "rejected" }
  ];

  for (const a of appts) {
    const date = new Date();
    date.setDate(date.getDate() + a.dateOffset);
    await AppointmentModel.create({ studentId: a.student._id, facultyId: a.faculty._id, title: a.title, date, startTime: a.start, endTime: a.end, durationMinutes: 30, status: a.status as any });
  }

  // follows
  await FollowModel.create({ studentId: students[0]._id, facultyId: facultyUsers[0]._id });
  await NotificationModel.create({ userId: facultyUsers[0]._id, type: "follow", message: `${students[0].name} started following you` });

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
