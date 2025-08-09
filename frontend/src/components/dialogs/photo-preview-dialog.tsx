import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Calendar, Download, MapPin, Share2, X } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { findCommonDenominatorAndBroader } from "@/lib/extract-common-location";
import { Photo, PhotoCollection } from "@/lib/photo-sorting";
import { AnimatePresence, motion } from "framer-motion";

interface PhotoPreviewProps {
  selectedPhoto: Photo | null;
  collection: PhotoCollection;
  onChangePhoto?: (photo: Photo) => void;
  onClose: () => void;
}

const STRIP_COUNT = 9;
const THUMB_H = 10;

export function PhotoPreview({
  selectedPhoto,
  onClose,
  collection,
  onChangePhoto,
}: PhotoPreviewProps) {
  const [menuVisible, setShowMenu] = useState(false);
  const hideMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const showNextPhoto = useCallback(() => {
    if (!selectedPhoto) return;
    const nextPhoto = collection.nextPhoto(selectedPhoto);
    if (nextPhoto) {
      setDirection(1);
      onChangePhoto?.(nextPhoto);
    }
  }, [collection, onChangePhoto, selectedPhoto]);

  const showPreviousPhoto = useCallback(() => {
    if (!selectedPhoto) return;
    const previousPhoto = collection.previousPhoto(selectedPhoto);
    if (previousPhoto) {
      setDirection(-1);
      onChangePhoto?.(previousPhoto);
    }
  }, [collection, onChangePhoto, selectedPhoto]);

  const showMenu = useCallback(() => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    setShowMenu(true);
    if (
      !Array.from(menuRef.current?.children || []).some((el) =>
        el.matches(":hover")
      )
    ) {
      hideMenuTimer.current = setTimeout(() => setShowMenu(false), 3000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", showMenu);
    return () => {
      window.removeEventListener("mousemove", showMenu);
      if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    };
  }, [showMenu]);

  const stripPhotos = useMemo(() => {
    if (!selectedPhoto) return [] as Photo[];
    const half = Math.floor(STRIP_COUNT / 2);

    const prevs: Photo[] = [];
    let cursorPrev: Photo | null = selectedPhoto;
    for (let i = 0; i < half; i++) {
      const prev: Photo | null = cursorPrev
        ? collection.previousPhoto(cursorPrev)
        : null;
      if (!prev) break;
      prevs.push(prev);
      cursorPrev = prev;
    }

    const nexts: Photo[] = [];
    let cursorNext: Photo | null = selectedPhoto;
    for (let i = 0; i < half; i++) {
      const next: Photo | null = cursorNext
        ? collection.nextPhoto(cursorNext)
        : null;
      if (!next) break;
      nexts.push(next);
      cursorNext = next;
    }

    while (prevs.length < half && nexts.length) {
      const extraNext = collection.nextPhoto(nexts[nexts.length - 1]);
      if (!extraNext) break;
      nexts.push(extraNext);
    }
    while (nexts.length < half && prevs.length) {
      const extraPrev = collection.previousPhoto(prevs[prevs.length - 1]);
      if (!extraPrev) break;
      prevs.push(extraPrev);
    }

    return [...prevs.reverse(), selectedPhoto, ...nexts].slice(0, STRIP_COUNT);
  }, [selectedPhoto, collection]);

  const address = useMemo(
    () => (selectedPhoto ? selectedPhoto.fullLocation : "Unknown location"),
    [selectedPhoto]
  );

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") showPreviousPhoto();
      else if (ev.key === "ArrowRight") showNextPhoto();
      else if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showNextPhoto, showPreviousPhoto]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const next = collection.nextPhoto(selectedPhoto);
    const prev = collection.previousPhoto(selectedPhoto);
    [next?.originalUrl, prev?.originalUrl].forEach((u) => {
      if (!u) return;
      const img = new Image();
      img.src = u;
    });
  }, [selectedPhoto, collection]);

  const download = async () => {
    if (!selectedPhoto) return;
    const response = await fetch(selectedPhoto.originalUrl, { mode: "cors" });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = selectedPhoto.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!selectedPhoto} onOpenChange={() => onClose()}>
      <DialogContent
        className="h-screen p-0 w-full !max-w-full"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only" />
        {selectedPhoto && (
          <div className="flex flex-col overflow-hidden">
            <div
              ref={containerRef}
              className="relative overflow-hidden flex-1 justify-center items-center flex bg-black/5 touch-pan-y"
            >
              <AnimatePresence
                initial={false}
                custom={direction}
                mode="popLayout"
              >
                <motion.img
                  key={(selectedPhoto as any).id ?? selectedPhoto.originalUrl}
                  src={selectedPhoto.originalUrl}
                  alt={selectedPhoto.description ?? ""}
                  className="object-contain object-center w-full h-full select-none"
                  draggable={false}
                  custom={direction}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  variants={{
                    enter: (dir: 1 | -1) => ({
                      x: dir * 60,
                      opacity: 0,
                      scale: 0.985,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.26, ease: "easeOut" },
                    },
                    exit: (dir: 1 | -1) => ({
                      x: -dir * 60,
                      opacity: 0,
                      scale: 0.985,
                      transition: { duration: 0.2, ease: "easeIn" },
                    }),
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  dragMomentum={false}
                  onDragEnd={(_, info) => {
                    const swipePower =
                      Math.abs(info.offset.x) *
                      Math.min(Math.abs(info.velocity.x), 2);
                    const threshold = 200;
                    if (
                      info.offset.x < -80 ||
                      (info.velocity.x < -300 && swipePower > threshold)
                    )
                      showNextPhoto();
                    else if (
                      info.offset.x > 80 ||
                      (info.velocity.x > 300 && swipePower > threshold)
                    )
                      showPreviousPhoto();
                  }}
                />
              </AnimatePresence>
            </div>

            <div
              ref={menuRef}
              className={cn(
                "transition-all duration-300 opacity-0",
                menuVisible && "opacity-100"
              )}
            >
              <div className="absolute top-0 left-0 flex gap-2 justify-between w-full p-4 bg-background/60 border-b backdrop-blur-sm">
                <Button
                  variant={"ghost"}
                  size="icon"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="gap-1">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    onClick={download}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="absolute left-0 right-0 bottom-[144px] pointer-events-auto">
                <div className="mx-auto max-w-5xl px-4">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 -mask-b-to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 mask-b-to-transparent" />
                    <div className="overflow-hidden">
                      <motion.ul
                        key={
                          (selectedPhoto as any).id ??
                          selectedPhoto.thumbnailUrl
                        }
                        className="flex justify-center gap-2"
                        initial={{ x: direction === 1 ? 40 : -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction === 1 ? -40 : 40, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        {stripPhotos.map((p) => {
                          const isSelected = p === selectedPhoto;
                          return (
                            <motion.li
                              key={(p as any).id ?? p.originalUrl}
                              className="p-1"
                              layout
                            >
                              <button
                                onClick={() => onChangePhoto?.(p)}
                                className={cn(
                                  `relative h-16 overflow-hidden rounded-xl cursor-pointer`,
                                  "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  isSelected ? "ring-2 ring-primary" : "ring-0"
                                )}
                                aria-current={isSelected}
                                aria-label={p.description ?? "Thumbnail"}
                              >
                                <motion.img
                                  src={p.originalUrl}
                                  alt={p.description ?? ""}
                                  className={cn(
                                    "w-full h-full object-cover select-none",
                                    isSelected
                                      ? "scale-100"
                                      : "scale-[0.96] opacity-90"
                                  )}
                                  draggable={false}
                                  layout
                                  transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 24,
                                  }}
                                />
                              </button>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-background/60 w-full absolute bottom-0 border-t backdrop-blur-sm">
                <div className="container mx-auto">
                  <h1 className="text-2xl font-bold truncate">
                    {selectedPhoto.title}
                  </h1>
                  <h2 className="text-md text-muted-foreground truncate">
                    {selectedPhoto.description}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedPhoto.formattedTime}
                    </div>
                    •
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedPhoto.formattedTime}
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
