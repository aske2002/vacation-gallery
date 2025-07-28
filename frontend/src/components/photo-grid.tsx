import { AlbumItem } from "@/types/api";
import PhotoItem from "./photo-item";
import { DefaultLoader } from "./default-loader";

interface PhotoGridProps {
  photos: AlbumItem[];
  onClickPhoto: (photo: AlbumItem) => void;
  onSelectionChange?: (selected: Set<number>) => void;
  selectedPhotos?: Set<number>;
  loading?: boolean;
}

export default function PhotoGrid({
  photos,
  onClickPhoto,
  onSelectionChange,
  selectedPhotos,
  loading,
}: PhotoGridProps) {
  const selectPhoto = (id: number) => {
    const newSet = new Set(selectedPhotos);
    if (selectedPhotos && selectedPhotos.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange?.(newSet);
  };

  return (
    <div className="mx-auto w-full">
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {loading && <DefaultLoader />}
        {!loading &&
          photos.map((photo) => (
            <PhotoItem
              item={photo}
              onClick={onClickPhoto}
              key={photo.id}
              selected={selectedPhotos?.has(photo.id)}
              onSelect={onSelectionChange ? selectPhoto : undefined}
            />
          ))}
      </div>
    </div>
  );
}
