import { PhotoType, PhotoEditableMetadata } from "@common/types/photo";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import DateInput from "./ui/date-input";
import { useMemo } from "react";
import LocationInput from "./ui/location-input";

interface PhotoEditFormProps {
  value: PhotoEditableMetadata;
  onChange: (value: PhotoEditableMetadata) => void;
  disabled?: boolean;
}

export default function PhotoEditForm({
  value,
  onChange,
  disabled,
}: PhotoEditFormProps) {
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      title: e.target.value,
    });
  };

  const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      description: e.target.value,
    });
  };

  const onLocationChange = (e: google.maps.LatLngLiteral) => {
    onChange({
      ...value,
      latitude: e.lat,
      longitude: e.lng,
    });
  };

  const onDateChange = (date: Date | undefined) => {
    onChange({
      ...value,
      taken_at: date?.toISOString(),
    });
  };

  const timestampAsDate = useMemo(() => {
    return value.taken_at ? new Date(value.taken_at) : undefined;
  }, [value.taken_at]);

  const location = useMemo((): google.maps.LatLngLiteral | undefined => {
    return value.latitude && value.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : undefined;
  }, [value.latitude, value.longitude]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Title"
        value={value.title ?? ""}
        onChange={onTitleChange}
        disabled={disabled}
      />
      <Textarea
        placeholder="Description"
        value={value.description ?? ""}
        onChange={onDescriptionChange}
        disabled={disabled}
      />
      <DateInput
        onChange={onDateChange}
        value={timestampAsDate}
        placeholder="Timestamp"
        disabled={disabled}
        className="w-full"
      />
      <LocationInput onChange={onLocationChange} value={location} />
    </div>
  );
}
