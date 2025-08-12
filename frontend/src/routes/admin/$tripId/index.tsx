import PhotoGrid from "@/components/photo-grid";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Navigation, Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/loading-button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  useDeletePhotos,
  usePhotos,
  useTrip,
  useTripPhotos,
  useUpdateTrip,
} from "@/hooks/useVacationGalleryApi";
import { UploadDialog } from "@/components/dialogs/upload-dialog";
import { RouteList } from "@/components/route/route-list";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Trip, UpdateTripRequest } from "vacation-gallery-common";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DateInput from "@/components/ui/date-input";
import formatDate from "@/lib/format-date";

export const Route = createFileRoute("/admin/$tripId/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminComponent />
    </ProtectedRoute>
  );
}

const AdminComponent = () => {
  const { tripId } = Route.useParams();

  const [uploadPreview, setUploadPreview] = useState<File[] | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [editingTrip, setEditingTrip] = useState(false);

  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);
  const updateTripMutation = useUpdateTrip();

  const { data: photos, isLoading: isLoadingPhotos } = useTripPhotos(tripId);
  const { mutateAsync: deletePhotosMutation, isPending: isDeleting } =
    useDeletePhotos();

  const getDefaultUpdateTripRequest = (trip?: Trip): UpdateTripRequest => {
    return {
      name: trip?.name || "",
      description: trip?.description || "",
      start_date: trip?.start_date || "",
      end_date: trip?.end_date || "",
    };
  };

  const form = useForm<UpdateTripRequest>({
    defaultValues: getDefaultUpdateTripRequest(trip),
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid, isDirty },
  } = form;

  useEffect(() => {
    if (trip) {
      reset(getDefaultUpdateTripRequest(trip));
    }
  }, [trip, reset]);

  const handleUpdateTrip = async (data: UpdateTripRequest) => {
    if (!isValid || !isDirty) {
      return;
    }
    try {
      await updateTripMutation.mutateAsync({
        id: tripId,
        data,
      });
      reset(data);
      setEditingTrip(false);
      toast.success("Trip updated successfully");
    } catch (error) {
      toast.error("Failed to update trip");
    }
  };

  const handleDeletePhotos = async (photoIds: string[]) => {
    if (photoIds.length === 0) {
      return;
    }
    await deletePhotosMutation(photoIds);
    setSelectedPhotos(new Set());
    setUploadPreview(null);
  };

  const upload = async () => {
    const selectInput = document.createElement("input") as HTMLInputElement;
    selectInput.type = "file";
    selectInput.multiple = true;
    selectInput.accept = "image/*,.dng,.raw,.cr2,.nef,.arw,.orf,.rw2";
    selectInput.onchange = async () => {
      const files = selectInput.files;
      if (!files || files.length === 0) {
        return;
      }
      setUploadPreview(Array.from(files));
    };
    selectInput.click();
  };

  const handleSelectAll = () => {
    if (!photos) return;
    if (selectedPhotos?.size === photos.count) {
      setSelectedPhotos?.(new Set());
    } else {
      setSelectedPhotos?.(new Set(photos?.all.map((p) => p.id)));
    }
  };

  return (
    <div className="grow flex w-full flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleUpdateTrip)}
          className="flex flex-col gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTrip
                  ? "Editing trip"
                  : `Admin Panel for Trip ${trip?.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    {editingTrip ? (
                      <>
                        <FormControl>
                          <Input
                            {...field}
                            className="input"
                            placeholder="Trip name"
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {trip?.name}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    {editingTrip ? (
                      <>
                        <FormControl>
                          <Input
                            {...field}
                            className="input"
                            placeholder="Trip description"
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {trip?.description || "No description available"}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    {editingTrip ? (
                      <>
                        <FormControl>
                          <DateInput
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            className="grow w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {formatDate(trip?.start_date)}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    {editingTrip ? (
                      <>
                        <FormControl>
                          <DateInput
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            className="grow w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {formatDate(trip?.end_date)}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex gap-2">
              {editingTrip ? (
                <>
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    disabled={!isValid || !isDirty}
                  >
                    Save Changes
                  </LoadingButton>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTrip(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditingTrip(true)}>
                  Edit Trip
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>

      <div className="grow w-full flex flex-col gap-4">
        <UploadDialog
          files={uploadPreview}
          tripId={tripId}
          onClose={() => setUploadPreview(null)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos
            </h2>
            <div className="flex items-center gap-4 z-10">
              <Button onClick={upload}>Upload</Button>

              {photos && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedPhotos?.size === photos.count
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
              {selectedPhotos?.size != undefined && selectedPhotos.size > 0 && (
                <LoadingButton
                  variant="destructive"
                  size="sm"
                  loading={isDeleting}
                  onClick={() => handleDeletePhotos(Array.from(selectedPhotos))}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedPhotos?.size || 0})
                </LoadingButton>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {selectedPhotos?.size || 0} of {photos?.count || 0} selected
            </div>
            <PhotoGrid
              onClickPhoto={() => {}}
              photos={photos}
              loading={isLoadingPhotos}
              onSelectionChange={setSelectedPhotos}
              selectedPhotos={selectedPhotos}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Routes
            </h2>
            <RouteList tripId={tripId} />
          </div>
        </div>
      </div>
    </div>
  );
};
