import { ComponentPropsWithoutRef, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { LatLng, NominatimResult } from "@common/types/nominatim";
import { cn } from "@/lib/utils";

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
const searchNominatim = async (query: string): Promise<NominatimResult[]> => {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1`
    );

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
};

export default function LocationSearch({
  onSelect,
  ...props
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ["nominatim-search", debouncedSearch],
    queryFn: () => searchNominatim(debouncedSearch),
    initialData: [],
    enabled: searchQuery.length > 2,
  });

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
        className={cn(props.className,"pr-10")}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Live Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-9999 overflow-auto">
          <Command className="rounded-lg border shadow-md bg-popover">
            <CommandList className="max-h-60">
              <CommandGroup>
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.place_id}
                    onSelect={() => selectSearchResult(result)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2 text-lg">
                      {getPlaceTypeIcon(result.type, result.class)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {result.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.display_name}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
