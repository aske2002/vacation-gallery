import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { LatLng, NominatimResult } from "@common/types/nominatim";
import { cn } from "@/lib/utils";
import { DefaultLoader } from "./default-loader";

const getPlaceTypeIcon = (type: string, placeClass: string): string => {
  if (!type && !placeClass) return "📍";

  // Map Nominatim types/classes to icons
  if (type === "restaurant" || placeClass === "amenity") return "🍽️";
  if (type === "hotel" || type === "guest_house" || placeClass === "tourism")
    return "🏨";
  if (type === "attraction" || type === "museum") return "🎯";
  if (type === "park" || placeClass === "leisure") return "�";
  if (type === "shop" || placeClass === "shop") return "🛍️";
  if (type === "fuel" || placeClass === "amenity") return "⛽";
  if (type === "hospital" || type === "clinic") return "🏥";
  if (type === "school" || type === "university") return "🎓";
  if (type === "bank") return "🏦";
  if (type === "place_of_worship") return "⛪";
  if (type === "aerodrome") return "✈️";
  if (type === "station" || placeClass === "railway") return "🚇";
  if (type === "bus_stop") return "🚌";

  return "📍";
};

// Nominatim geocoding function
const searchNominatim = async (
  query: string,
  location?: LatLng
): Promise<NominatimResult[]> => {
  if (!query || query.length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  if (location) {
    url.searchParams.set(
      "viewbox",
      `${(location.lng - 0.1).toFixed(2)},${(location.lat + 0.1).toFixed(2)},${(location.lng + 0.1).toFixed(2)},${(location.lat - 0.1).toFixed(2)}`
    );
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Nominatim search failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Nominatim search error:", error);
    toast.error("Search failed. Please try again.");
    return [];
  }
};

type LocationSearchProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  "onChange" | "value" | "onSelect"
> & {
  onSelect: (value: LatLng, full: NominatimResult) => void;
  referenceLocation?: LatLng;
};

export default function LocationSearch({
  onSelect,
  referenceLocation,
  ...props
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data: searchResults,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["nominatim-search", debouncedSearch],
    queryFn: () => searchNominatim(debouncedSearch, referenceLocation),
    initialData: [],
    enabled: searchQuery.length > 2,
  });

  useEffect(() => {
    dataUpdatedAt && searchResults;
  }, [dataUpdatedAt]);

  const selectSearchResult = (result: NominatimResult) => {
    const latLng: LatLng = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    onSelect(latLng, result);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <Input
        {...props}
        placeholder="Search restaurants, landmarks, addresses..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => {
          // Hide results after a small delay to allow clicking on results
          setTimeout(() => setShowResults(false), 100);
        }}
        className={cn(props.className, "pr-10")}
      />
      {isFetching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <DefaultLoader className="relative" color="white" size={15} />
        </div>
      )}

      {/* Live Search Results */}
      {showResults && !isFetching && (
        <div className="absolute top-16/12 left-0 right-0 z-9999 overflow-auto">
          <Command className="rounded-lg bg-primary">
            <CommandList className="max-h-60">
              <CommandGroup>
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.place_id}
                    onSelect={() => selectSearchResult(result)}
                    className="cursor-pointer transition-colors bg-transparent! hover:bg-secondary/20!"
                  >
                    <span className="mr-2 text-lg">
                      {getPlaceTypeIcon(result.type, result.class)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-secondary truncate">
                        {result.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {result.display_name}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {searchResults.length === 0 && (
                  <CommandItem disabled className="text-muted">
                    {searchQuery.length > 2
                      ? "No results found"
                      : "Type at least 3 characters to search"}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
