import { z } from "zod";

export const facultyProfileSchema = z.object({ bio: z.string().optional(), qualifications: z.array(z.string()).optional(), specializations: z.array(z.string()).optional(), officeLocation: z.string().optional(), currentLocation: z.string().optional(), isOnline: z.boolean().optional() });
