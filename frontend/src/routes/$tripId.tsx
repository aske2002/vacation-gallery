import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Map } from "lucide-react";
import { PhotoPreview } from "@/components/dialogs/photo-preview-dialog";
import FAB from "@/components/ui/fab";
import MapDialog from "@/components/dialogs/map-dialog";
import {
  useTripPhotos,
} from "@/hooks/useVacationGalleryApi";
import { api } from "@/api/api";
import PhotoGrid from "@/components/photo-grid";
import { Photo } from "@common/types/photo";
import MapComponentOSM from "@/components/map-component-osm";

export const Route = createFileRoute("/$tripId")({
  component: Index,
  loader: ({ params: { tripId } }) => api.getTripById(tripId),
});

function Index() {
  const { tripId } = Route.useParams();
  const trip = Route.useLoaderData();
  const { data: photos, isLoading } = useTripPhotos(tripId);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showMap, setShowMap] = useState(false);
  return (
    <div className="grow w-full flex flex-col gap-4">
      <MapDialog
        open={showMap}
        onClose={() => setShowMap(false)}
        onClickPhoto={setSelectedPhoto}
      />
      <Card className="pb-0 overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div>
              <CardTitle>{trip.name}</CardTitle>
              <CardDescription>{trip.description}</CardDescription>
            </div>
            </div>
        </CardHeader>
        <CardContent className="h-96 p-0">
          <MapComponentOSM onClickPhoto={setSelectedPhoto}></MapComponentOSM>
        </CardContent>
      </Card>

      <PhotoGrid
        onClickPhoto={setSelectedPhoto}
        photos={photos || []}
        loading={isLoading}
      />

      <PhotoPreview
        selectedPhoto={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
      <FAB Icon={Map} wiggle onClick={() => setShowMap(true)} />
    </div>
  );
}
