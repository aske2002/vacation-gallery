import { AlbumItem } from "@/types/api";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { Api } from "@/api/synoApi";
import { Button } from "./ui/button";
import { Calendar, Download, Share2, X } from "lucide-react";
import useFormattedAddress from "@/hooks/useFormattedAddress";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface PhotoPreviewProps {
  selectedPhoto: AlbumItem | null;
  onClose: () => void;
}

export function PhotoPreview({ selectedPhoto, onClose }: PhotoPreviewProps) {
  const url = useMemo(() => {
    return selectedPhoto ? Api.getThumnailUrl(selectedPhoto, "xl") : undefined;
  }, [selectedPhoto]);

  const [menuVisible, setShowMenu] = useState(false);
  const hideMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const showMenu = (ev: MouseEvent) => {
    if (hideMenuTimer.current) {
      clearTimeout(hideMenuTimer.current);
    }
    setShowMenu(true);

    if (
      !Array.from(menuRef.current?.children || []).some((el) =>
        el.matches(":hover")
      )
    ) {
      hideMenuTimer.current = setTimeout(() => {
        setShowMenu(false);
      }, 3000);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", showMenu);
    return () => {
      window.removeEventListener("mousemove", showMenu);
      if (hideMenuTimer.current) {
        clearTimeout(hideMenuTimer.current);
      }
    };
  }, []);

  const address = useFormattedAddress(selectedPhoto);

  return (
    <Dialog open={!!selectedPhoto} onOpenChange={() => onClose()}>
      <DialogContent
        className="h-screen p-0 w-full !max-w-full"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only"/>
        {selectedPhoto && (
          <div className="flex flex-col overflow-hidden">
            <div className="relative overflow-hidden flex-1 justify-center items-center flex">
              <img
                src={url}
                className="object-contain object-center flex-1 h-full"
              />
            </div>
            <div
              ref={menuRef}
              className={cn(
                "transition-all duration-300 opacity-0",
                menuVisible && "opacity-100"
              )}
            >
              <div className="absolute top-0 left-0 flex gap-2 justify-between w-full p-4 bg-background/60 border-b transition-all">
                <Button variant={"ghost"} size="icon" onClick={onClose}>
                  <X className="w-6 h-6" />
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="gap-1">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="p-6 bg-background/60 w-full absolute bottom-0 border-t">
                <div className="container mx-auto">
                  <h2 className="text-xl font-bold">
                    {selectedPhoto.additional.description}
                  </h2>
                  <p className="text-muted-foreground">{address}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {dayjs(selectedPhoto.time * 1000).format("MMM D, YYYY")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
