import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Filter, FilterX, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandInput, CommandItem } from "./ui/command";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ISelectProps<T> {
  placeholder: string;
  options: T[];
  selectedOptions: T[];
  keyGetter: (option: T) => string;
  labelGetter: (option: T) => string;
  metaGetter?: (option: T) => string;
  setSelectedOptions: Dispatch<SetStateAction<T[]>>;
}
export default function MultiSelect<T>({
  placeholder,
  options: values,
  keyGetter,
  labelGetter,
  metaGetter,
  selectedOptions: selectedItems,
  setSelectedOptions: setSelectedItems,
}: ISelectProps<T>) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [onlySelected, setOnlySelected] = React.useState(false);

  const handleOptionToggled = (value: T) => {
    if (!selectedItems.includes(value)) {
      setSelectedItems((prev) => {
        const newSelectedItems = [...prev, value];
        return newSelectedItems;
      });
    } else if (selectedItems.includes(value)) {
      const referencedArray = [...selectedItems];
      const indexOfItemToBeRemoved = referencedArray.indexOf(value);
      referencedArray.splice(indexOfItemToBeRemoved, 1);
      setSelectedItems(referencedArray);
    }
  };

  const isOptionSelected = (value: T): boolean => {
    return selectedItems.some(
      (selected) => keyGetter(selected) === keyGetter(value)
    );
  };

  const filteredValues = React.useMemo(() => {
    const q = search.toLowerCase();

    return values
      .filter((v) => (onlySelected ? isOptionSelected(v) : true))
      .map((option) => {
        const label = labelGetter(option).toLowerCase();
        const meta = metaGetter ? metaGetter(option).toLowerCase() : "";

        let score = 0;
        if (label === q || meta === q) score = 3;
        else if (label.startsWith(q) || meta.startsWith(q)) score = 2;
        else if (label.includes(q) || meta.includes(q)) score = 1;

        return { option, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.option);
  }, [search, values, onlySelected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between font-normal"
        >
          <div className="flex w-full items-center gap-1 overflow-hidden justify-between">
            <span className="text-left flex-1 overflow-auto">
              {selectedItems.length > 0 ? (
                selectedItems.map(labelGetter).join(", ")
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            {selectedItems.length > 0 && (
              <Button
                asChild
                variant={"ghost"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItems([]);
                }}
                size="icon"
                className="h-4 w-4 text-muted-foreground hover:bg-transparent cursor-pointer"
              >
                <div>
                  <X className="size-4" />
                </div>
              </Button>
            )}
            <ChevronsUpDown />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            className="h-9"
            onValueChange={setSearch}
            value={search}
            endAdornment={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setOnlySelected((prev) => !prev);
                    }}
                  >
                    {onlySelected ? (
                      <FilterX className="size-4" />
                    ) : (
                      <Filter className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {onlySelected
                      ? "Show all options"
                      : "Show only selected options"}
                  </p>
                </TooltipContent>
              </Tooltip>
            }
          />
          <OptionsList
            options={filteredValues}
            keyGetter={keyGetter}
            labelGetter={labelGetter}
            metaGetter={metaGetter}
            optionToggled={handleOptionToggled}
            isOptionSelected={isOptionSelected}
            className="max-h-[400px] overflow-auto"
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface OptionsListProps<T> {
  options: T[];
  keyGetter: (option: T) => string;
  labelGetter: (option: T) => string;
  metaGetter?: (option: T) => string;
  optionToggled: (option: T) => void;
  className?: string;
  isOptionSelected: (item: T) => boolean;
}

function OptionsList<T>({
  options,
  keyGetter,
  labelGetter,
  metaGetter,
  optionToggled,
  isOptionSelected,
  className = "",
}: OptionsListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => keyGetter(options[index]),
    estimateSize: () => 100, // Adjust based on your item height,
    overscan: 50,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: `400px`,
        overflow: "auto", // Make it scroll!
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = options[virtualItem.index];
          const label = labelGetter(item);
          const meta = metaGetter ? metaGetter(item) : null;
          const key = keyGetter(item);

          return (
            <CommandItem
              key={virtualItem.key}
              data-index={virtualItem.index}
              value={key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              ref={rowVirtualizer.measureElement}
              onSelect={(currentValue) => {
                const selectedItem = options.find(
                  (option) => keyGetter(option) === currentValue
                );
                if (selectedItem) {
                  optionToggled(selectedItem);
                }
              }}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between w-full items-center">
                  {label}
                  <Check
                    className={cn(
                      "ml-auto",
                      isOptionSelected(item) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
                {meta && (
                  <span className="text-xs text-muted-foreground">{meta}</span>
                )}
              </div>
            </CommandItem>
          );
        })}
      </div>
    </div>
  );
}
