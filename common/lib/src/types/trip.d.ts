import { CreateTripRequest } from "./request/create-trip-request";
export type Trip = CreateTripRequest & {
    id: string;
    created_at: string;
    updated_at: string;
};
