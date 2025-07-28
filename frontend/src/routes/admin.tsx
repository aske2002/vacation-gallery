import { Api } from "@/api/synoApi";
import PhotoGrid from "@/components/photo-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadDialog } from "@/components/upload-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/loading-button";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: album } = useQuery({
    queryKey: ["albumInfo"],
    queryFn: () => Api.getAlbum(),
  });
  const [uploadPreview, setUploadPreview] = useState<File[] | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Api.getApiInfo().then((res) => {
      console.log("API Info:", res);
    });
    if (!isAuthenticated && !isLoading) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading]);

  const {
    data: photos,
    refetch: refetchPhotos,
    isLoading: isLoadingPhotos,
  } = useQuery({
    queryKey: ["photos"],
    queryFn: async () =>
      Api.listPhotos(Api.album).then((res) => res.data.list || []),
  });

  const { mutateAsync: deletePhotos, isPending: isDeleting } = useMutation({
    mutationFn: async (photos: number[]) => {
      if (token) {
        await Api.delete(photos, token);
        await refetchPhotos();
        setSelectedPhotos(new Set());
      }
    },
  });

  const upload = async () => {
    const selectInput = document.createElement("input") as HTMLInputElement;
    selectInput.type = "file";
    selectInput.multiple = true;
    selectInput.accept = "image/*,.dng";
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
    <div className="min-h-screen w-full flex flex-col gap-4">
      <UploadDialog
        album={album}
        files={uploadPreview}
        onClose={() => setUploadPreview(null)}
      />
      <div className="flex items-center gap-4">
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
              onClick={() => deletePhotos(Array.from(selectedPhotos))}
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
}
