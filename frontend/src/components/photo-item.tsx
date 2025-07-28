import { useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Api } from "@/api/synoApi";
import { AlbumItem } from "@/types/api";
import { Calendar, Check, Edit3, MapPin, X } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import usePhotos from "@/hooks/usePhotos";
import { LoadingButton } from "./loading-button";
import useFormattedAddress from "@/hooks/useFormattedAddress";
import LoadingImage from "./loading-image";
import { motion } from "framer-motion";

interface PhotoItemProps {
  item: AlbumItem;
  onClick: (photo: AlbumItem) => void;
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export default function PhotoItem({
  item,
  onClick,
  selected,
  onSelect,
}: PhotoItemProps) {
  const { token } = useAuth();
  const { setQueryData } = usePhotos();
  const [editingPhoto, setEditingPhoto] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [ready, setReady] = useState<boolean>(false);

  const url = useMemo(() => {
    return Api.getThumnailUrl(item);
  }, [item]);

  const { mutateAsync: updateDescription, isPending: isUpdating } = useMutation(
    {
      mutationFn: async (description: string) => {
        token && (await Api.setDescription(item.id, description, token));
      },
      onSuccess: (_, description) => {
        setQueryData((photos) =>
          photos.map((photo) =>
            photo.id === item.id
              ? { ...photo, additional: { ...photo.additional, description } }
              : photo
          )
        );
      },
      onSettled: () => {
        cancelEdit();
      },
    }
  );

  const startEditing = () => {
    setEditingPhoto(true);
    setEditingDescription(item.additional.description);
  };

  const cancelEdit = () => {
    setEditingPhoto(false);
    setEditingDescription("");
  };

  const randomDelay = useMemo(() => Math.random() * 3, []);
  const formattedAddress = useFormattedAddress(item);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.5 }}
      animate={ready && { opacity: 1, scale: 1 }}
      transition={{ delay: randomDelay, duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <Card
        onClick={() => !onSelect && onClick(item)}
        key={item.id}
        className={`group cursor-pointer hover:shadow-lg transition-all p-0 break-inside-avoid overflow-hidden mb-4 ${
          selected ? "ring-2 ring-blue-500 shadow-lg" : ""
        }`}
      >
        <CardContent className="p-0 flex flex-col">
          <div className="overflow-hidden rounded-t-lg">
            <LoadingImage
              src={url}
              onLoaded={() => setReady(true)}
              onError={() => setReady(true)}
              alt={item.additional.description}
              width={item.additional.resolution.width}
              height={item.additional.resolution.height}
              className={cn("shadow w-full h-auto", selected && "opacity-60")}
              onClick={() => onSelect?.(item.id)}
            />

            {/* Selection Indicator (Admin Mode) */}
            {onSelect && (
              <div className="absolute top-2 left-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                    selected
                      ? "bg-blue-500 border-blue-500 shadow-lg"
                      : "bg-white/90 border-white/90 hover:bg-white hover:scale-110"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.id);
                  }}
                >
                  {selected && (
                    <div className="flex items-center justify-center w-full h-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Button (Admin Mode) */}
            {onSelect && (
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing();
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Editable Title */}
            {editingPhoto ? (
              <div className="space-y-2 mb-2">
                <h3 className="font-semibold mb-1">{item.filename}</h3>

                <Textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="text-sm resize-none"
                  rows={2}
                  placeholder="Photo description"
                />
                <div className="flex gap-2">
                  <LoadingButton
                    size="sm"
                    loading={isUpdating}
                    onClick={() => updateDescription(editingDescription)}
                    className="gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </LoadingButton>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    className="gap-1 bg-transparent"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold mb-1">{item.filename}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {item.additional.description}
                </p>
              </>
            )}

            {!editingPhoto && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {formattedAddress}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dayjs(item.time * 1000).format("MMM D, YYYY")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
