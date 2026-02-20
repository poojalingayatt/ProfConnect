// Query key constants for consistent React Query usage across the application
// This prevents string duplication and ensures type safety

export const queryKeys = {
  // Faculty related queries
  facultyList: () => ['facultyList'] as const,
  facultyDetail: (id: number) => ['faculty', 'detail', id] as const,
  facultyFollowed: () => ['faculty', 'followed'] as const,
  facultyFollowers: () => ['faculty', 'followers'] as const,
  facultyProfile: (userId?: number) => ['faculty', 'profile', userId] as const,
  
  // User related queries
  userProfile: () => ['user', 'profile'] as const,
  userNotifications: () => ['user', 'notifications'] as const,
  
  // Appointment related queries
  appointments: () => ['appointments'] as const,
  appointmentDetail: (id: number) => ['appointments', 'detail', id] as const,
  
  // Availability related queries
  availability: (facultyId: number) => ['availability', facultyId] as const,
} as const;

// Type helper for query key inference
export type QueryKeys = typeof queryKeys;