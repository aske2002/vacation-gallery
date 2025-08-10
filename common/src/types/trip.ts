import z from "zod";
import { CreateTripRequest } from "./request/create-trip-request";

export type Trip = CreateTripRequest & {
  id: string;
  created_at: string;
  updated_at: string;
};

export const UpdateTripRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type UpdateTripRequest = z.infer<typeof UpdateTripRequestSchema>;
