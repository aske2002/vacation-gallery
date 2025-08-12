import { api } from "@/api/api";
import { FlightData } from "vacation-gallery-common";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export default function useFlightData(
  options: Omit<
    UseQueryOptions<FlightData>,
    "refetchInterval" | "queryKey" | "queryFn"
  > = {}
) {
  return useQuery({
    ...options,
    queryKey: ["flight-data"],
    refetchInterval: 2500,
    queryFn: api.getFlightData,
  });
}
