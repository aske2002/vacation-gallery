import { Api } from "@/api/synoApi";
import { AlbumItem } from "@/types/api";
import { Feature, Point } from "geojson";
import { useMemo } from "react";
import LoadingImage from "./loading-image";
import { InfoWindow } from "@vis.gl/react-google-maps";
import { findCommonDenominatorAndBroader } from "@/lib/extract-common-location";

interface ImageWindowContent {
  items: Feature<Point, AlbumItem>[];
  anchor: google.maps.marker.AdvancedMarkerElement;
  onClickPhoto?: (item: AlbumItem) => void;
  onClose?: () => void;
}

export default function ImagePopupContent({
  items,
  anchor,
  onClickPhoto,
  onClose,
}: ImageWindowContent) {
  const title = useMemo(() => {
    return findCommonDenominatorAndBroader(items.map((i) => i.properties)).join(
      ", "
    );
  }, [items]);

  return (
    <InfoWindow
      anchor={anchor}
      onCloseClick={() => onClose?.()}
      className="flex flex-col gap-2"
      headerContent={
        <div className="text-card p-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p>{items.length} pictures in location</p>
        </div>
      }
    >
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
        {items.map((item) => (
          <ImagePopupItem
            onClick={() => onClickPhoto?.(item.properties)}
            key={item.id}
            item={item.properties}
          />
        ))}
      </div>
    </InfoWindow>
  );
}

interface ImagePopupItemProps {
  item: AlbumItem;
  onClick?: () => void;
}

function ImagePopupItem({ item, onClick: onSelect }: ImagePopupItemProps) {
  const url = useMemo(() => {
    return Api.getThumnailUrl(item, "sm");
  }, [item]);

  return (
    <LoadingImage
      key={item.id}
      src={url}
      onClick={() => onSelect?.()}
      width={item.additional.resolution.width}
      height={item.additional.resolution.height}
      className={
        "mb-4 break-inside-avoid w-full rounded-md shadow min-h-32 cursor-pointer hover:opacity-80 transition-opacity"
      }
    />
  );
}
