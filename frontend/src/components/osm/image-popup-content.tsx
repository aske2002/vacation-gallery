import { Feature, Point } from "geojson";
import { useMemo } from "react";
import LoadingImage from "../loading-image";
import { Popup } from "react-leaflet";
import { findCommonDenominatorAndBroader } from "@/lib/extract-common-location";
import { Photo } from "@/lib/photo-sorting";
import { LatLngExpression } from "leaflet";

interface ImagePopupContentProps {
  items: Feature<Point, Photo>[];
  position: LatLngExpression;
  onClickPhoto?: (item: Photo) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export default function ImagePopupContent({
  items,
  position,
  onClickPhoto,
  onClose,
  isOpen,
}: ImagePopupContentProps) {
  const title = useMemo(() => {
    return findCommonDenominatorAndBroader(items.map((i) => i.properties)).join(
      ", "
    );
  }, [items]);

  if (!isOpen) return null;

  return (
    <Popup
      position={position}
      className="image-popup"
      maxWidth={600}
      minWidth={300}
      eventHandlers={{
        remove: () => onClose?.(),
      }}
    >
      <div className="flex flex-col gap-0">
        <div className="text-card p-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="m-0!">{items.length} pictures in location</p>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <ImagePopupItem
              onClick={() => onClickPhoto?.(item.properties)}
              key={item.id}
              item={item.properties}
            />
          ))}
        </div>
      </div>
    </Popup>
  );
}

interface ImagePopupItemProps {
  item: Photo;
  onClick?: () => void;
}

function ImagePopupItem({
  item,
  onClick: onSelect,
}: ImagePopupItemProps) {
  return (
    <LoadingImage
      key={item.id}
      src={item}
      onClick={() => onSelect?.()}
      className={
        "mb-4 w-full rounded-md shadow cursor-pointer hover:opacity-80 transition-opacity"
      }
    />
  );
}
