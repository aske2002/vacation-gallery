import PhotoItem from "./photo-item";
import { DefaultLoader } from "./default-loader";
import { PhotoType } from "vacation-gallery-common";
import { Photo, PhotoCollection } from "@/lib/photo-sorting";

interface PhotoGridProps {
  photos?: PhotoCollection;
  onClickPhoto: (photo: Photo) => void;
  onSelectionChange?: (selected: Set<string>) => void;
  selectedPhotos?: Set<string>;
  loading?: boolean;
}

export default function PhotoGrid({
  photos,
  onClickPhoto,
  onSelectionChange,
  selectedPhotos,
  loading,
}: PhotoGridProps) {
  const selectPhoto = (id: string) => {
    const newSet = new Set(selectedPhotos);
    if (selectedPhotos && selectedPhotos.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange?.(newSet);
  };

  return (
    <>
      {loading ||
        (!photos && (
          <div className="grow flex justify-center items-center">
            <DefaultLoader />
          </div>
        ))}
      {!loading && photos && (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 grow">
          {photos.all.map((photo) => (
            <PhotoItem
              item={photo}
              onClick={onClickPhoto}
              key={photo.id}
              selected={selectedPhotos?.has(photo.id)}
              onSelect={onSelectionChange ? selectPhoto : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
