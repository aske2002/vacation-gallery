import { Feature, Point } from "geojson";
import { useMemo } from "react";
import LoadingImage from "./loading-image";
import { InfoWindow } from "@vis.gl/react-google-maps";
import { api } from "@/api/api";
import { Photo } from "@common/types/photo";

interface ImageWindowContent {
  items: Feature<Point, Photo>[];
  anchor: google.maps.marker.AdvancedMarkerElement;
  onClickPhoto?: (item: Photo) => void;
  onClose?: () => void;
}

export default function ImagePopupContent({
  items,
  anchor,
  onClickPhoto,
  onClose,
}: ImageWindowContent) {
  const title = useMemo(() => {
    // return findCommonDenominatorAndBroader(items.map((i) => i.properties)).join(
    //   ", "
    // );
    return "Coming soon"
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
  item: Photo;
  onClick?: () => void;
}

function ImagePopupItem({ item, onClick: onSelect }: ImagePopupItemProps) {
  return (
    <LoadingImage
      key={item.id}
      src={item}
      onClick={() => onSelect?.()}
      width={item.width}
      height={item.height}
      className={
        "mb-4 break-inside-avoid w-full rounded-md shadow min-h-32 cursor-pointer hover:opacity-80 transition-opacity"
      }
    />
  );
}
