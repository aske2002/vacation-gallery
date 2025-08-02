import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useTripPhotos,
  useTripsWithPhotoCounts,
} from "@/hooks/useVacationGalleryApi";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Trip } from "@common/types/trip";
import { api, TripWithPhotoCount } from "@/api/api";
import { useMemo } from "react";
import { Photo } from "@common/types/photo";
import { getFlagEmoji } from "@/lib/flag-emoji";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: trips, isLoading } = useTripsWithPhotoCounts();
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full flex flex-col gap-4">
      {trips &&
        trips.map((trip) => (
          <Trip
            trip={trip}
            onClick={(t) =>
              navigate({
                to: "/$tripId",
                params: {
                  tripId: t.id,
                },
              })
            }
          />
        ))}
    </div>
  );
}

interface TripProps {
  trip: TripWithPhotoCount;
  onClick?: (trip: TripWithPhotoCount) => void;
}

function Trip({ trip, onClick }: TripProps) {
  const { data: tripPhotos } = useTripPhotos(trip.id);

  const countries = useMemo(() => {
    if (!tripPhotos) return [];

    return Array.from(
      new Map<string, string>(
        tripPhotos
          .map((t) =>
            t.country && t.country_code
              ? ([t.country_code, t.country] as const)
              : undefined
          )
          .filter((c) => !!c)
      )
    ).map((c) => ({
      code: c[0],
      name: c[1],
    }));
  }, [trip]);

  const max10EquallySpacedPhotos = useMemo(() => {
    if (!tripPhotos || tripPhotos.length === 0) return [];

    const sortedByDate = [...tripPhotos].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const count = Math.min(10, sortedByDate.length);
    if (count === sortedByDate.length) return sortedByDate;

    const step = (sortedByDate.length - 1) / (count - 1);
    return Array.from(
      { length: count },
      (_, i) => sortedByDate[Math.round(i * step)]
    );
  }, [tripPhotos]);

  return (
    <Card
      onClick={() => onClick?.(trip)}
      key={trip.id}
      className="cursor-pointer hover:bg-neutral-800 transition-all"
    >
      <CardContent className="flex gap-4">
        <div className="flex-col justify-start">
          <CardTitle>{trip.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {trip.description || "No description available"}
          </p>
          <div className="flex gap-2 text-2xl">
            {countries.map((c) => (
              <p className="hover:scale-110 transition-all">{getFlagEmoji(c.code)}</p>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            {max10EquallySpacedPhotos.map((photo) => (
              <TripThumbnailImage key={photo.id} photo={photo} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {trip.photoCount} photos in total
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TripThumnailImageProps {
  photo: Photo;
}

function TripThumbnailImage({ photo }: TripThumnailImageProps) {
  const url = useMemo(() => {
    return api.getThumbnailUrl(photo.filename);
  }, [photo.id]);

  return (
    <img
      src={url}
      alt={photo.description || "Trip photo"}
      className="w-16 h-16 object-cover rounded"
    />
  );
}
