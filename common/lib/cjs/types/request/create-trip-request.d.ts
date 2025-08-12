import z from "zod";
export declare const CreateTripRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodString;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    start_date: string;
    description?: string | undefined;
    end_date?: string | undefined;
}, {
    name: string;
    start_date: string;
    description?: string | undefined;
    end_date?: string | undefined;
}>;
export type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>;
