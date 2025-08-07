import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MapComponentOSM from "../map-component-osm";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";

interface MapDialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onClickPhoto?: (photo: any) => void;
  title?: string;
}

export default function MapDialog({
  open,
  onClose,
  onOpenChange,
  onClickPhoto,
  title,
}: MapDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full p-0 max-w-full! max-h-full! h-full"
        showCloseButton={false}
      >
        <MapComponentOSM onClickPhoto={onClickPhoto} />
        <Button
          size={"icon"}
          variant={"default"}
          onClick={() => {
            onClose?.()
          }}
          className="absolute left-2 top-2"
        >
          <XIcon />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
