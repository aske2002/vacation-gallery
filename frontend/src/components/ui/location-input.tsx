import { ComponentPropsWithoutRef, useMemo, useState } from "react";
import { Input } from "./input";
import { LocationPicker } from "../location-picker";

type LocationInputProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  "onChange" | "value"
> & {
  value?: google.maps.LatLngLiteral;
  onChange: (value: google.maps.LatLngLiteral) => void;
  initialLocation?: google.maps.LatLngLiteral;
};

export default function LocationInput({
  value,
  onChange,
  initialLocation,
  ...rest
}: LocationInputProps) {
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const formattedValue = useMemo(() => {
    return value ? `${value.lat.toFixed(2)}°, ${value.lng.toFixed(2)}°` : undefined;
  }, [value]);

  const onLocationPicked = (value: google.maps.LatLngLiteral) => {
    setPickerOpen(false);
    onChange(value);
  };

  return (
    <>
      <Input
        value={formattedValue}
        onClick={() => !pickerOpen && setPickerOpen(true)}
        {...rest}
      ></Input>
      <LocationPicker
        onLocationPicked={onLocationPicked}
        initialLocation={value}
        onCancel={() => setPickerOpen(false)}
        open={pickerOpen}
      />
    </>
  );
}
