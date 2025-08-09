import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Calendar, Check, Edit3, MapPin } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { LoadingButton } from "./loading-button";
import LoadingImage from "./loading-image";
import { api } from "@/api/api";
import {
  useTripsWithPhotoCounts,
  useUpdatePhoto,
} from "@/hooks/useVacationGalleryApi";
import { PhotoType, PhotoEditableMetadata } from "@common/types/photo";
import PhotoEditForm from "./photo-edit-form";
import { useForm } from "react-hook-form";
import { Photo } from "@/lib/photo-sorting";

interface PhotoItemProps {
  item: Photo;
  onClick: (photo: Photo) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export default function PhotoItem({
  item,
  onClick,
  selected,
  onSelect,
}: PhotoItemProps) {
  const [editingPhoto, setEditingPhoto] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  useTripsWithPhotoCounts;

  const { mutateAsync: updatePhoto, isPending: isUpdating } = useUpdatePhoto();

  const startEditing = () => {
    setEditingPhoto(true);
  };

  const cancelEdit = () => {
    setEditingPhoto(false);
  };

  const handleEditSubmit = async (formdata: {
    value: PhotoEditableMetadata;
  }) => {
    await updatePhoto({
      id: item.id,
      data: value,
    }).finally(() => {
      setEditingPhoto(false);
    });
  };

  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<{
    value: PhotoEditableMetadata;
  }>();

  useEffect(() => {
    reset({
      value: {
        latitude: item.coordinates?.latitude,
        longitude: item.coordinates?.longitude,
        altitude: item.coordinates?.altitude,
        description: item.description || "",
        title: item.title || "",
        taken_at: item.timeISO,
      },
    });
  }, [item]);

  const { value } = watch();

  const formattedAddress = useMemo(() => {
    return item.mediumLocation;
  }, [item]);

  return (
    <Card
      onClick={() => !onSelect && onClick(item)}
      key={item.id}
      className={`group relative cursor-pointer hover:shadow-lg transition-all p-0 pb-4 break-inside-avoid overflow-hidden mb-4 gap-2 ${
        selected ? "ring-2 ring-blue-500 shadow-lg" : ""
      }`}
    >
      <CardHeader className="p-0">
        <div className="overflow-hidden rounded-t-lg relative">
          <LoadingImage
            src={item}
            className={cn("w-full h-auto", selected && "opacity-60")}
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

          {onSelect && (
            <div className="absolute top-2 right-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  editingPhoto ? cancelEdit() : startEditing();
                }}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="">
          {/* Editable Title */}
          {editingPhoto ? (
            <div>
              <PhotoEditForm
                value={value}
                onChange={(v) =>
                  setValue("value", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={isUpdating}
              />
            </div>
          ) : (
            <>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {item.description}
              </p>
            </>
          )}

          {!editingPhoto && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span
                  className="truncate cursor-help"
                  title={item.fullLocation}
                >
                  {formattedAddress}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.formattedTime}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {editingPhoto && (
        <CardFooter className="gap-2 flex">
          <LoadingButton
            loading={isUpdating}
            disabled={!isDirty || !isValid}
            onClick={handleSubmit(handleEditSubmit)}
          >
            Save
          </LoadingButton>
          <Button variant={"outline"} onClick={cancelEdit}>
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
