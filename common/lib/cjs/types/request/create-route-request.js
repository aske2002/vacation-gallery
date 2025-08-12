"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRouteStopSchema = exports.UpdateRouteRequestSchema = exports.CreateRouteRequestSchema = exports.CreateRouteStopSchema = void 0;
const zod_1 = require("zod");
exports.CreateRouteStopSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Stop title is required'),
    description: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    order_index: zod_1.z.number().int().min(0)
});
exports.CreateRouteRequestSchema = zod_1.z.object({
    trip_id: zod_1.z.string().uuid('Valid trip ID is required'),
    title: zod_1.z.string().min(1, 'Route title is required'),
    description: zod_1.z.string().optional(),
    profile: zod_1.z.enum([
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
    stops: zod_1.z.array(exports.CreateRouteStopSchema)
});
exports.UpdateRouteRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    profile: zod_1.z.enum([
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
exports.UpdateRouteStopSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    order_index: zod_1.z.number().int().min(0).optional()
});
