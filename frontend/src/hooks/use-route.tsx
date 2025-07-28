import { FurkotApi } from "@/api/furkotApi";
import { TripStep } from "@/types/trip";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import polyline from "@mapbox/polyline";

export default function useRoute(): {
  stops: TripStep[] | undefined;
  route: google.maps.LatLngLiteral[];
  loading: boolean;
} {
  const { data: stops, isLoading } = useQuery({
    queryKey: ["route"],
    queryFn: async () => {
      return await FurkotApi.getRoute().then((res) =>
        res.filter((step) => !step.skip)
      );
    },
  });

  const route = useMemo(() => {
    return (
      stops
        ?.flatMap((step) => step.expander)
        .sort((a, b) => b.position - a.position)
        .flatMap((step) =>
          step.route.flatMap((r) =>
            r.polyline
              ? r.polyline[0] === "6"
                ? polyline
                    .decode(r.polyline, 6)
                    .map(([lng, lat]) => ({ lat, lng }))
                    .slice(1, -1)
                : polyline
                    .decode(r.polyline, 5)
                    .map(([lng, lat]) => ({ lat, lng }))
              : []
          )
        ) || []
    );
  }, [stops]);

  return {
    stops,
    route,
    loading: isLoading,
  };
}
