import PhotoGrid from "@/components/photo-grid";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/loading-button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useDeletePhotos, usePhotos } from "@/hooks/useVacationGalleryApi";
import { UploadDialog } from "@/components/dialogs/upload-dialog";

export const Route = createFileRoute("/admin/$tripId")({
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

  const navigate = useNavigate();

  const { data: photos, isLoading: isLoadingPhotos } = usePhotos();

  const { mutateAsync: deletePhotos, isPending: isDeleting } = useDeletePhotos();

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
    if (selectedPhotos?.size === photos?.length) {
      setSelectedPhotos?.(new Set());
    } else {
      setSelectedPhotos?.(new Set(photos?.map((p) => p.id)));
    }
  };

  return (
    <div className="grow w-full flex flex-col gap-4">
      <UploadDialog
        files={uploadPreview}
        tripId={tripId}
        onClose={() => setUploadPreview(null)}
      />
      <div className="flex items-center gap-4 z-10">
        <div className="flex items-center gap-2">
          <Button onClick={upload}>Upload</Button>

          {photos && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedPhotos?.size === photos.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
          {selectedPhotos?.size != undefined && selectedPhotos.size > 0 && (
            <LoadingButton
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={() =>
                deletePhotos(Array.from(selectedPhotos))
              }
              className="gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedPhotos?.size || 0})
            </LoadingButton>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedPhotos?.size || 0} of {photos?.length || 0} selected
      </div>
      <PhotoGrid
        onClickPhoto={() => {}}
        photos={photos || []}
        loading={isLoadingPhotos}
        onSelectionChange={setSelectedPhotos}
        selectedPhotos={selectedPhotos}
      />
    </div>
  );
};
