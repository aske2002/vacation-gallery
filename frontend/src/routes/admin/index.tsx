import { DefaultLoader } from "@/components/default-loader";
import CreateTripDialog from "@/components/dialogs/create-trip-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardTitle } from "@/components/ui/card";
import {
  useCreateTrip,
  useDeleteTrip,
  useTripsWithPhotoCounts,
} from "@/hooks/useVacationGalleryApi";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: allTrips, isLoading } = useTripsWithPhotoCounts();
  const [creatingTrip, setCreatingTrip] = useState(false);
  const {
    mutateAsync: deleteTripMutation,
    isPending: isDeletingTrip,
    variables: deletingId,
  } = useDeleteTrip();

  return (
    <div className="grow w-full flex flex-col gap-4">
      <CreateTripDialog
        open={creatingTrip}
        onClose={() => setCreatingTrip(false)}
      />
      <div className="flex gap-4">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Button
          size={"icon"}
          onClick={() => setCreatingTrip(true)}
          className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-2 w-2" />
        </Button>
      </div>
      {isLoading && (
        <div className="grow flex justify-center items-center">
          <DefaultLoader />
        </div>
      )}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTrips?.map((trip) => (
            <Card key={trip.id}>
              <CardContent>
                <CardTitle>{trip.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {trip.description || "No description available"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Photos: {trip.photoCount}
                </p>
                <CardAction>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      navigate({
                        to: "/admin/$tripId",
                        params: { tripId: trip.id.toString() },
                      });
                    }}
                  >
                    View Trip
                  </Button>
                  <LoadingButton
                    variant="destructive"
                    loading={isDeletingTrip && deletingId === trip.id}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this trip? This action cannot be undone."
                        )
                      ) {
                        deleteTripMutation(trip.id);
                      }
                    }}
                  >
                    Delete
                  </LoadingButton>
                </CardAction>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
