import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { FormControl } from "./form";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { format } from "date-fns";

export default function DateInput({
  value,
  onChange,
  label,
  placeholder,
  ...rest
}: Omit<
  React.ComponentPropsWithoutRef<"button">,
  "value" | "onChange" | "label" | "placeholder"
> & {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
}) {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onChange(date);
    } else {
      onChange(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          {...rest}
          variant="outline"
          className={cn(
            "pl-3 text-left font-normal",
            !value && "text-muted-foreground",
            rest.className
          )}
        >
          {value ? format(value, "PPP") : placeholder}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
