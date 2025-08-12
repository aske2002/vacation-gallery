import z from "zod";
export const UpdateTripRequestSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
});
