import z from "zod";
import { CreateTripRequest } from "./request/create-trip-request";
export type Trip = CreateTripRequest & {
    id: string;
    created_at: string;
    updated_at: string;
};
export declare const UpdateTripRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
export type UpdateTripRequest = z.infer<typeof UpdateTripRequestSchema>;
