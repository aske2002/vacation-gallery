import { Dialog, DialogContent } from "./ui/dialog";
import { AlbumItem } from "@/types/api";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import MapComponent from "./map-component";

interface MapDialogProps {
  open: boolean;
  onClose: () => void;
  onClickPhoto?: (photo: AlbumItem) => void;
}

export default function MapDialog({
  open,
  onClose,
  onClickPhoto,
}: MapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="h-screen p-0 w-full !max-w-full"
        showCloseButton={false}
      >
        <Button
          variant={"secondary"}
          size="icon"
          onClick={onClose}
          className="absolute top-2 left-2 z-10"
        >
          <X className="w-6 h-6" />
        </Button>
        <MapComponent onClickPhoto={onClickPhoto} />
      </DialogContent>
    </Dialog>
  );
}
