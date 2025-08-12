import { api } from "@/api/api";
import { PhotoPreview } from "@/components/dialogs/photo-preview-dialog";
import MapComponent from "@/components/osm/map-component";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/hooks/useVacationGalleryApi";
import { Photo, PhotoCollection } from "@/lib/photo-sorting";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$tripId/map")({
  component: RouteComponent,
  loader: ({ params: { tripId } }) =>
    queryClient.ensureQueryData<PhotoCollection>({
      queryKey: queryKeys.tripPhotos(tripId),
      queryFn: () => api.getTripPhotos(tripId),
    }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const photosCollection = Route.useLoaderData();
  const { tripId } = Route.useParams();

  const handleClose = () => {
    navigate({
      to: "/$tripId",
      params: { tripId },
    });
  };

  return (
    <div className="w-full p-0 max-w-full! max-h-full! h-full fixed top-0 left-0">
      <PhotoPreview
        selectedPhoto={selectedPhoto}
        onChangePhoto={setSelectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        collection={photosCollection as PhotoCollection}
      />
      <MapComponent onClickPhoto={setSelectedPhoto} tripId={tripId} />
      <Button
        size={"icon"}
        variant={"secondary"}
        onClick={() => {
          handleClose();
        }}
        className="absolute left-2 top-2"
      >
        <XIcon />
      </Button>
    </div>
  );
}
