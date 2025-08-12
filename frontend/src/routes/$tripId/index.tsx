import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CalendarCheck, CalendarPlus, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoPreview } from "@/components/dialogs/photo-preview-dialog";
import FAB from "@/components/ui/fab";
import { useTripPhotos } from "@/hooks/useVacationGalleryApi";
import { api } from "@/api/api";
import PhotoGrid from "@/components/photo-grid";
import formatDate from "@/lib/format-date";
import { Photo } from "@/lib/photo-sorting";
import MapComponent from "@/components/osm/map-component";

export const Route = createFileRoute("/$tripId/")({
  component: Index,
  loader: ({ params: { tripId } }) => api.getTripById(tripId),
});

function Index() {
  const navigate = Route.useNavigate();
  const { tripId } = Route.useParams();
  const trip = Route.useLoaderData();
  const { data: photos, isLoading } = useTripPhotos(tripId);

  const goToMap = () => {
    navigate({
      to: "/$tripId/map",
      params: { tripId },
    });
  };

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  return (
    <div className="grow w-full flex flex-col gap-4">
      <Card className="pb-0 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{trip.name}</CardTitle>
              <CardDescription>{trip.description}</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className="bg-blue-600 text-white">
                <CalendarPlus />
                <span>{formatDate(trip.start_date)}</span>
              </Badge>
              {trip.end_date && (
                <Badge variant="outline">
                  <CalendarCheck />
                  <span>{formatDate(trip.end_date)}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-96 p-0">
          <MapComponent
            tripId={tripId}
            onClickPhoto={setSelectedPhoto}
          ></MapComponent>
        </CardContent>
      </Card>

      <PhotoGrid
        onClickPhoto={setSelectedPhoto}
        photos={photos}
        loading={isLoading}
      />

      {photos && (
        <PhotoPreview
          selectedPhoto={selectedPhoto}
          onChangePhoto={setSelectedPhoto}
          collection={photos}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
      <FAB Icon={Map} wiggle onClick={goToMap} />
    </div>
  );
}
