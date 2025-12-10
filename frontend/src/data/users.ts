export interface Student {
  id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
  department: string;
  followedFaculty: number[];
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  password: string;
  department: string;
  specialization: string[];
  bio: string;
  qualifications: string[];
  officeLocation: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  availability: { day: string; slots: string[] }[];
  isOnline: boolean;
  currentLocation: string;
  announcements: { date: string; title: string }[];
}

export const students: Student[] = [
  {
    id: 1,
    name: "Aisha Patel",
    email: "student1@profconnect.com",
    password: "Student@123",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    department: "Computer Science",
    followedFaculty: [1, 3],
  },
  {
    id: 2,
    name: "Rohan Kumar",
    email: "student2@profconnect.com",
    password: "Student@123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    department: "Electronics",
    followedFaculty: [2],
  },
  {
    id: 3,
    name: "Priya Singh",
    email: "student3@profconnect.com",
    password: "Student@123",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    department: "Mechanical Engineering",
    followedFaculty: [1, 2, 3],
  },
];

export const faculty: Faculty[] = [
  {
    id: 1,
    name: "Prof. Rajesh Sharma",
    email: "faculty1@profconnect.com",
    password: "Faculty@123",
    department: "Computer Science",
    specialization: ["Data Structures", "Algorithms", "Web Development"],
    bio: "Passionate educator with 15+ years of experience in computer science. I believe in making complex concepts simple and accessible to all students.",
    qualifications: ["Ph.D. in Computer Science", "M.Tech in Software Engineering"],
    officeLocation: "Building A, Room 301",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    reviewCount: 127,
    followerCount: 234,
    availability: [
      { day: "Monday", slots: ["2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"] },
      { day: "Tuesday", slots: ["10:00 AM", "10:30 AM", "4:00 PM"] },
      { day: "Wednesday", slots: ["2:00 PM", "2:30 PM", "3:00 PM"] },
      { day: "Thursday", slots: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM"] },
      { day: "Friday", slots: ["11:00 AM", "11:30 AM"] },
    ],
    isOnline: true,
    currentLocation: "Building A, Room 301",
    announcements: [
      { date: "2024-12-03", title: "Office hours extended this week" },
      { date: "2024-11-28", title: "New study materials uploaded" },
    ],
  },
  {
    id: 2,
    name: "Prof. Meera Verma",
    email: "faculty2@profconnect.com",
    password: "Faculty@123",
    department: "Electronics",
    specialization: ["Circuit Design", "Embedded Systems", "IoT"],
    bio: "Electronics enthusiast dedicated to bridging the gap between theory and practical applications. Research interests include IoT and smart systems.",
    qualifications: ["Ph.D. in Electronics Engineering", "M.Sc. in Electrical Engineering"],
    officeLocation: "Building B, Room 205",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    rating: 4.6,
    reviewCount: 98,
    followerCount: 189,
    availability: [
      { day: "Monday", slots: ["9:00 AM", "9:30 AM", "10:00 AM"] },
      { day: "Tuesday", slots: ["2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"] },
      { day: "Wednesday", slots: ["11:00 AM", "11:30 AM"] },
      { day: "Thursday", slots: ["9:00 AM", "9:30 AM", "4:00 PM", "4:30 PM"] },
      { day: "Friday", slots: ["10:00 AM", "10:30 AM", "11:00 AM"] },
    ],
    isOnline: true,
    currentLocation: "Building B, Room 205",
    announcements: [
      { date: "2024-12-02", title: "Lab session rescheduled to Thursday" },
    ],
  },
  {
    id: 3,
    name: "Prof. Arjun Malhotra",
    email: "faculty3@profconnect.com",
    password: "Faculty@123",
    department: "Mechanical Engineering",
    specialization: ["Thermodynamics", "CAD/CAM", "Robotics"],
    bio: "Mechanical engineer with a passion for robotics and automation. I enjoy mentoring students on innovative projects and research.",
    qualifications: ["Ph.D. in Mechanical Engineering", "B.Tech in Mechanical Engineering"],
    officeLocation: "Building C, Room 112",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    reviewCount: 112,
    followerCount: 156,
    availability: [
      { day: "Monday", slots: ["3:00 PM", "3:30 PM", "4:00 PM"] },
      { day: "Tuesday", slots: ["11:00 AM", "11:30 AM", "12:00 PM"] },
      { day: "Wednesday", slots: ["2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"] },
      { day: "Thursday", slots: ["10:00 AM", "10:30 AM"] },
      { day: "Friday", slots: ["2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"] },
    ],
    isOnline: false,
    currentLocation: "Off Campus",
    announcements: [
      { date: "2024-12-04", title: "Project submission deadline extended" },
      { date: "2024-12-01", title: "Workshop on 3D printing next week" },
    ],
  },
];
