import { NPSFeature } from "vacation-gallery-common";
import { useQuery } from "@tanstack/react-query";
import { FeatureCollection, MultiPolygon } from "geojson";
import { geoJSON } from "leaflet";

export function useNationalParks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["national-parks"],
    queryFn: async () => {
      const response = await fetch("/geojson/nps.geojson");
      if (!response.ok) {
        throw new Error("Failed to fetch national parks data");
      }
      return geoJSON(
        (await response.json()) as FeatureCollection<MultiPolygon, NPSFeature>
      );
    },
  });

  return {
    parks: data,
    isLoading,
    error,
  };
}
