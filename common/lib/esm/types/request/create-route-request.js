import { z } from 'zod';
export const CreateRouteStopSchema = z.object({
    title: z.string().min(1, 'Stop title is required'),
    description: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    order_index: z.number().int().min(0)
});
export const CreateRouteRequestSchema = z.object({
    trip_id: z.string().uuid('Valid trip ID is required'),
    title: z.string().min(1, 'Route title is required'),
    description: z.string().optional(),
    profile: z.enum([
        'driving-car',
        'driving-hgv',
        'cycling-regular',
        'cycling-road',
        'cycling-mountain',
        'cycling-electric',
        'foot-walking',
        'foot-hiking',
        'wheelchair'
    ]).default('driving-car'),
    stops: z.array(CreateRouteStopSchema)
});
export const UpdateRouteRequestSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    profile: z.enum([
        'driving-car',
        'driving-hgv',
        'cycling-regular',
        'cycling-road',
        'cycling-mountain',
        'cycling-electric',
        'foot-walking',
        'foot-hiking',
        'wheelchair'
    ]).optional(),
});
export const UpdateRouteStopSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    order_index: z.number().int().min(0).optional()
});
