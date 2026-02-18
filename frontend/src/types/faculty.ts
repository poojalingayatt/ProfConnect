export interface Faculty {
  id: number;
  name: string;
  email: string;
  department?: string;
  facultyProfile: {
    bio?: string;
    rating: number;
    reviewCount: number;
    isOnline: boolean;
    specializations: { id: number; name: string }[];
  };
}

export interface FacultyListFilters {
  search?: string;
  department?: string;
  online?: boolean;
  hasAvailability?: boolean;
}