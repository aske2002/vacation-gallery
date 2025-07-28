import { Api } from "@/api/synoApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Album } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoadingButton } from "./loading-button";
import { useAuth } from "@/hooks/useAuth";
import { optimizeImages } from "@/lib/images";
import { DefaultLoader } from "./default-loader";
import { useMemo, useState } from "react";
import { LocationEditIcon } from "lucide-react";
import { LocationPicker } from "./location-picker";
import { computeBoundsAndCenter } from "@/hooks/use-coordinate-bounds";

interface UploadDialogProps {
  files: File[] | null;
  album?: Album;
  onClose: () => void;
}

export function UploadDialog({ files, onClose, album }: UploadDialogProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync: uploadFiles, isPending } = useMutation({
    mutationFn: async ({
      files,
      token,
      albumId,
    }: {
      albumId: number;
      files: File[];
      token: string;
    }) => {
      for (const file of files) {
        await Api.uploadFile(file, albumId, token);
        await queryClient.refetchQueries({
          queryKey: ["photos"],
        });
      }
    },
    onSuccess: () => {
      onClose();
      toast.success("Files uploaded successfully!");
    },
    onError: (error) => {
      toast.error(
        `Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    },
  });

  return (
    <>
      <Dialog open={files != null} onOpenChange={onClose}>
        <DialogContent className="max-h-full overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>Upload these files?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-scroll">
            {files?.map((photo) => (
              <div className="group-hover:scale-105 transition-transform duration-300 relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={photo.name}
                  className="object-cover z-1"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton
              loading={isPending || !album}
              onClick={() =>
                files &&
                album &&
                token &&
                uploadFiles({ albumId: album.id, files, token })
              }
            >
              Upload!
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
