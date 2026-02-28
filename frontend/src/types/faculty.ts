export interface Faculty {
  id: number;
  name: string;
  email: string;
  department?: string;
  avatar?: string;
  officeLocation?: string;
  followerCount: number;
  facultyProfile: {
    bio?: string;
    officeLocation?: string;
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