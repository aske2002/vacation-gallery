import { z } from 'zod';
export declare const CreateRouteStopSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    order_index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    latitude: number;
    longitude: number;
    order_index: number;
    description?: string | undefined;
}, {
    title: string;
    latitude: number;
    longitude: number;
    order_index: number;
    description?: string | undefined;
}>;
export declare const CreateRouteRequestSchema: z.ZodObject<{
    trip_id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    profile: z.ZodDefault<z.ZodEnum<["driving-car", "driving-hgv", "cycling-regular", "cycling-road", "cycling-mountain", "cycling-electric", "foot-walking", "foot-hiking", "wheelchair"]>>;
    optimized: z.ZodDefault<z.ZodBoolean>;
    stops: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        order_index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        latitude: number;
        longitude: number;
        order_index: number;
        description?: string | undefined;
    }, {
        title: string;
        latitude: number;
        longitude: number;
        order_index: number;
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    profile: "driving-car" | "driving-hgv" | "cycling-regular" | "cycling-road" | "cycling-mountain" | "cycling-electric" | "foot-walking" | "foot-hiking" | "wheelchair";
    title: string;
    trip_id: string;
    optimized: boolean;
    stops: {
        title: string;
        latitude: number;
        longitude: number;
        order_index: number;
        description?: string | undefined;
    }[];
    description?: string | undefined;
}, {
    title: string;
    trip_id: string;
    stops: {
        title: string;
        latitude: number;
        longitude: number;
        order_index: number;
        description?: string | undefined;
    }[];
    profile?: "driving-car" | "driving-hgv" | "cycling-regular" | "cycling-road" | "cycling-mountain" | "cycling-electric" | "foot-walking" | "foot-hiking" | "wheelchair" | undefined;
    description?: string | undefined;
    optimized?: boolean | undefined;
}>;
export declare const UpdateRouteRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodEnum<["driving-car", "driving-hgv", "cycling-regular", "cycling-road", "cycling-mountain", "cycling-electric", "foot-walking", "foot-hiking", "wheelchair"]>>;
    optimized: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    profile?: "driving-car" | "driving-hgv" | "cycling-regular" | "cycling-road" | "cycling-mountain" | "cycling-electric" | "foot-walking" | "foot-hiking" | "wheelchair" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    optimized?: boolean | undefined;
}, {
    profile?: "driving-car" | "driving-hgv" | "cycling-regular" | "cycling-road" | "cycling-mountain" | "cycling-electric" | "foot-walking" | "foot-hiking" | "wheelchair" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    optimized?: boolean | undefined;
}>;
export declare const UpdateRouteStopSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    order_index: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    order_index?: number | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    order_index?: number | undefined;
}>;
export type CreateRouteRequest = z.infer<typeof CreateRouteRequestSchema>;
export type UpdateRouteRequest = z.infer<typeof UpdateRouteRequestSchema>;
export type CreateRouteStop = z.infer<typeof CreateRouteStopSchema>;
export type UpdateRouteStop = z.infer<typeof UpdateRouteStopSchema>;
