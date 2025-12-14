import { z } from "zod";

const slot = z.object({ start: z.string(), end: z.string() });
const brk = z.object({ start: z.string(), end: z.string(), label: z.string().optional() });
const day = z.object({ day: z.number().min(0).max(6), slots: z.array(slot), breaks: z.array(brk) });

export const availabilitySchema = z.object({ week: z.array(day) });
