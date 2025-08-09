import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import {
  MapPin,
  Navigation,
  Globe,
  Building2,
  Clock,
  Calendar,
  ChevronRight,
  GripVertical,
  Search,
  Map as MapIcon,
  Bookmark,
} from "lucide-react";
import { RouteStop } from "@common/types/route";
import { PhotoCollection } from "@/lib/photo-sorting";

interface StopSheetProps {
  stops: RouteStop[];
  photos?: PhotoCollection;
  open: boolean;
  onClose: () => void;
  onClickStop?: (stop: RouteStop) => void;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StopCard({
  stop,
  onClick,
  photos,
}: {
  stop: RouteStop;
  onClick?: (s: RouteStop) => void;
  photos: PhotoCollection | undefined;
}) {
  const subtitle = [stop.location_name, stop.city, stop.country]
    .filter(Boolean)
    .join(" · ");

  const imgSrc = useMemo(() => {
    if (!photos) return undefined;
    const { latitude, longitude } = stop;
    if (!latitude || !longitude) return undefined;
    const photo = photos.closestTo({
      lat: latitude,
      lng: longitude,
    }, 25);
    return photo ? photo.thumbnailUrl : undefined;
  }, [photos, stop.id]);

  return (
    <div
      role="button"
      aria-label={`Open ${stop.title}`}
      onClick={() => onClick?.(stop)}
      className="cursor-pointer group relative overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md hover:bg-card"
    >
      <div className="grid grid-cols-[110px_1fr] gap-4 p-3 sm:p-4">
        <div className="relative col-span-1 h-[92px] w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapIcon className="h-7 w-7 opacity-80" />
          </div>
          {imgSrc && (
            <img
              src={imgSrc}
              alt={stop.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <Badge variant="secondary" className="backdrop-blur">
              #{stop.order_index + 1}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-1 flex min-w-0 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight sm:text-lg">
                {stop.title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
          </div>

          {stop.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {stop.description}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {stop.country_code || stop.country || "—"}
            </span>
            {stop.city && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {stop.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatDate(stop.updated_at)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(stop);
              }}
            >
              <MapPin className="mr-2 h-4 w-4" /> View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StopSheet({
  stops,
  open,
  photos,
  onClose,
  onClickStop,
}: StopSheetProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"order" | "title" | "recent">("order");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = !q
      ? stops
      : stops.filter((s) =>
          [
            s.title,
            s.description,
            s.location_name,
            s.city,
            s.state,
            s.country,
            s.country_code,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        );
    const sorted = [...arr];
    if (sortBy === "title")
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "recent")
      sorted.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    if (sortBy === "order")
      sorted.sort((a, b) => a.order_index - b.order_index);
    return sorted;
  }, [stops, query, sortBy]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        className="w-full sm:max-w-2xl flex flex-col p-0 overflow-auto"
      >
        <SheetHeader className="px-6 pb-2 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl">Route stops</SheetTitle>
              <SheetDescription>
                Browse, search, and select a stop on this route.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Controls */}
        <div className="sticky top-0 z-10 border-b bg-background/95 px-6 pb-3 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city, country…"
                className="pl-9"
                aria-label="Search stops"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-xs text-muted-foreground">
                Sort
              </Label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm shadow-sm outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Sort stops"
              >
                <option value="order">Route order</option>
                <option value="title">Title A–Z</option>
                <option value="recent">Recently updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 px-6 pb-24 pt-4">
          {filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <MapPin className="h-6 w-6 opacity-60" />
              <p className="text-sm text-muted-foreground">
                No stops match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((s) => (
                <StopCard key={s.id} stop={s} onClick={onClickStop} photos={photos}/>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator className="absolute bottom-16 left-0 right-0" />

        <SheetFooter className="pointer-events-none sticky bottom-0 z-10 mt-auto w-full bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="pointer-events-auto flex w-full items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <GripVertical className="h-4 w-4 opacity-60" />
              <span>
                {filtered.length} stop{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
