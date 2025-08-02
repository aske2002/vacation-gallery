import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  title 
}: MapDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title || "Map"}</DialogTitle>
        </DialogHeader>
        <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Map component not implemented</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
