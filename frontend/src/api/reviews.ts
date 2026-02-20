import { api } from '@/lib/api';

export interface Review {
  id: number;
  rating: number;
  comment: string;
  facultyId: number;
  studentId: number;
  appointmentId: number;
  createdAt: string;
}

export interface CreateReviewPayload {
  appointmentId: number;
  rating: number;
  comment: string;
}

export const createReview = async (payload: CreateReviewPayload) => {
  await api.post('/reviews', payload);
};

export const getFacultyReviews = async (facultyId: number) => {
  const res = await api.get(`/reviews/faculty/${facultyId}`);
  return res.data.reviews;
};