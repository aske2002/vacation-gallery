import { Feature, Point } from "geojson";
import { useMemo } from "react";
import LoadingImage from "../loading-image";
import { Popup } from "react-leaflet";
import { api } from "@/api/api";
import { Photo } from "@common/types/photo";
import { findCommonDenominatorAndBroader } from "@/lib/extract-common-location";

interface ImagePopupContentOSMProps {
  items: Feature<Point, Photo>[];
  position: [number, number];
  onClickPhoto?: (item: Photo) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export default function ImagePopupContentOSM({
  items,
  position,
  onClickPhoto,
  onClose,
  isOpen,
}: ImagePopupContentOSMProps) {
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
            <ImagePopupItemOSM
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

interface ImagePopupItemOSMProps {
  item: Photo;
  onClick?: () => void;
}

function ImagePopupItemOSM({ item, onClick: onSelect }: ImagePopupItemOSMProps) {
  return (
    <LoadingImage
      key={item.id}
      src={item}
      onClick={() => onSelect?.()}
      className={
        "mb-4 w-full rounded-md shadow min-h-32 cursor-pointer hover:opacity-80 transition-opacity"
      }
    />
  );
}
