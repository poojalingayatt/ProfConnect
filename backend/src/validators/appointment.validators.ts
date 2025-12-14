import { z } from "zod";

export const createAppointmentSchema = z.object({ facultyId: z.string().min(1), title: z.string().min(1), date: z.string(), startTime: z.string(), endTime: z.string(), durationMinutes: z.number().min(1) });
