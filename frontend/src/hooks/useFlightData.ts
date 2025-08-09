import { api } from "@/api/api";
import { useQuery } from "@tanstack/react-query";

export default function useFlightData() {
  return useQuery({
    queryKey: ["flight-data"],
    refetchInterval: 2500,
    queryFn: api.getFlightData,
  });
}
