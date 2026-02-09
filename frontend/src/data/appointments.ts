export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  studentId: number;
  facultyId: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  location: string;
  createdAt: string;
}

export const appointments: Appointment[] = [
  {
    id: 1,
    studentId: 1,
    facultyId: 1,
    title: "Doubt Session - Data Structures",
    description: "Need clarification on linked lists and binary trees",
    date: "2024-12-10",
    time: "2:00 PM",
    duration: 30,
    status: "accepted",
    location: "Building A, Room 301",
    createdAt: "2024-12-04T08:00:00",
  },
  {
    id: 2,
    studentId: 1,
    facultyId: 2,
    title: "Project Discussion - IoT Sensor",
    description: "Want to discuss my IoT project proposal",
    date: "2024-12-15",
    time: "10:00 AM",
    duration: 45,
    status: "pending",
    location: "Building B, Room 205",
    createdAt: "2024-12-05T09:30:00",
  },
  {
    id: 3,
    studentId: 1,
    facultyId: 3,
    title: "Career Guidance",
    description: "Need advice on pursuing masters in robotics",
    date: "2024-12-20",
    time: "3:00 PM",
    duration: 30,
    status: "accepted",
    location: "Building C, Room 112",
    createdAt: "2024-12-03T14:00:00",
  },
  {
    id: 4,
    studentId: 2,
    facultyId: 1,
    title: "Algorithm Help",
    description: "Struggling with dynamic programming concepts",
    date: "2024-12-11",
    time: "3:00 PM",
    duration: 30,
    status: "pending",
    location: "Building A, Room 301",
    createdAt: "2024-12-05T11:00:00",
  },
  {
    id: 5,
    studentId: 2,
    facultyId: 2,
    title: "Lab Equipment Query",
    description: "Questions about oscilloscope usage",
    date: "2024-12-08",
    time: "2:30 PM",
    duration: 30,
    status: "completed",
    location: "Building B, Lab 101",
    createdAt: "2024-12-01T10:00:00",
  },
  {
    id: 6,
    studentId: 3,
    facultyId: 1,
    title: "Web Development Project",
    description: "Need guidance on React architecture",
    date: "2024-12-12",
    time: "2:30 PM",
    duration: 45,
    status: "accepted",
    location: "Building A, Room 301",
    createdAt: "2024-12-04T16:00:00",
  },
  {
    id: 7,
    studentId: 3,
    facultyId: 3,
    title: "Internship Recommendation",
    description: "Request for recommendation letter",
    date: "2024-12-18",
    time: "4:00 PM",
    duration: 30,
    status: "pending",
    location: "Building C, Room 112",
    createdAt: "2024-12-05T08:30:00",
  },
];

export interface Notification {
  id: number;
  userId: number;
  userType: 'student' | 'faculty';
  type: 'appointment_accepted' | 'appointment_rejected' | 'appointment_cancelled' | 'appointment_reminder' | 'new_follower' | 'new_announcement' | 'appointment_request';
  message: string;
  timestamp: string;
  read: boolean;
}

export const notifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    userType: 'student',
    type: 'appointment_accepted',
    message: "Prof. Rajesh Sharma accepted your appointment for Dec 10, 2024 at 2:00 PM",
    timestamp: "2024-12-04T10:30:00",
    read: false,
  },
  {
    id: 2,
    userId: 1,
    userType: 'student',
    type: 'appointment_reminder',
    message: "Reminder: You have an appointment with Prof. Rajesh Sharma tomorrow at 2:00 PM",
    timestamp: "2024-12-09T10:00:00",
    read: false,
  },
  {
    id: 3,
    userId: 1,
    userType: 'student',
    type: 'new_announcement',
    message: "Prof. Rajesh Sharma posted a new announcement: Office hours extended this week",
    timestamp: "2024-12-03T15:00:00",
    read: true,
  },
  {
    id: 4,
    userId: 1,
    userType: 'faculty',
    type: 'appointment_request',
    message: "Aisha Patel has requested an appointment for Dec 10, 2024 at 2:00 PM",
    timestamp: "2024-12-04T08:00:00",
    read: true,
  },
  {
    id: 5,
    userId: 1,
    userType: 'faculty',
    type: 'new_follower',
    message: "Priya Singh started following you",
    timestamp: "2024-12-03T12:00:00",
    read: true,
  },
  {
    id: 6,
    userId: 1,
    userType: 'faculty',
    type: 'appointment_request',
    message: "Rohan Kumar has requested an appointment for Dec 11, 2024 at 3:00 PM",
    timestamp: "2024-12-05T11:00:00",
    read: false,
  },
];
