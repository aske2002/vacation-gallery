import z from "zod";
export const CreateTripRequestSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    start_date: z.string(),
    end_date: z.string().optional(),
});
