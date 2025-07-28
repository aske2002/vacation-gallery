import { AlbumItem } from "@/types/api";
import { useMemo } from "react";

export default function useFormattedAddress(item?: AlbumItem | null): string {
  return useMemo(() => {
    if (!item || !item.additional.address) return "Unknown Location";
    return [
      item.additional.address.landmark_id,
      item.additional.address.district_id,
      item.additional.address.city_id,
      item.additional.address.state_id,
      item.additional.address.country_id,
    ]
      .filter(Boolean)
      .join(", ");
  }, [item]);
}
