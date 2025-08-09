import { RouteStop } from "@common/types/route";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  UpdateRouteRequest,
  UpdateRouteRequestSchema,
  UpdateRouteStop,
  UpdateRouteStopSchema,
} from "@common/types/request/create-route-request";
import {
  useDeleteRouteStop,
  useUpdateRouteStop,
} from "@/hooks/useVacationGalleryApi";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { ArrowDown, ArrowUp, CloudCheck, CloudOff, X } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DefaultLoader } from "../default-loader";

interface RouteStopItemProps {
  stop: RouteStop;
  moveStop: (direction: "up" | "down") => void;
  totalStops: number;
  onNavigateClicked: () => void;
}

export default function RouteStopItem({
  stop,
  moveStop,
  totalStops,
  onNavigateClicked,
}: RouteStopItemProps) {
  const blurTimer = useRef<NodeJS.Timeout | null>(null);
  const updateRouteStopMutation = useUpdateRouteStop();
  const deleteStopMutation = useDeleteRouteStop();

  const getFormDefaults = (stop: RouteStop): UpdateRouteRequest => {
    return {
      title: stop.title,
      description: stop.description || "",
    };
  };

  const form = useForm<UpdateRouteRequest>({
    defaultValues: getFormDefaults(stop),
    shouldFocusError: false,
    reValidateMode: "onChange",
    resolver: zodResolver(UpdateRouteRequestSchema),
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    reset(getFormDefaults(stop));
  }, [stop]);

  const handleSubmit = async (
    value: Omit<UpdateRouteStop, "latitude" | "longitude">
  ) => {
    try {
      await updateRouteStopMutation.mutateAsync({
        routeId: stop.route_id,
        stopId: stop.id,
        data: value,
      });
    } catch (error) {
      toast.error("Failed to update stop");
      console.error("Error updating stop:", error);
    }
  };

  const resetTimer = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
    }
    blurTimer.current = setTimeout(() => {
      form.handleSubmit(handleSubmit)();
    }, 500);
  };

  return (
    <Form {...form}>
      <div className={`p-3 border bg-accent rounded-md h-26 flex`}>
        <div className="flex gap-2 h-full grow">
          <Button
            size={"sm"}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer h-full!"
            onClick={onNavigateClicked}
            type="button"
          >
            {stop.order_index}
          </Button>
          <div className="flex-1 min-w-0 gap-2 flex-col flex">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="h-full">
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={() => {
                        resetTimer();
                        field.onBlur();
                      }}
                      onChange={(e) => {
                        field.onChange(e);
                        resetTimer();
                      }}
                      className="h-full text-sm"
                      onFocus={resetTimer}
                      placeholder="Stop name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Input
              className="text-xs! h-6! max-w-md"
              disabled
              value={`${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    onBlur={() => {
                      resetTimer();
                      field.onBlur();
                    }}
                    onChange={(e) => {
                      field.onChange(e);
                      resetTimer();
                    }}
                    onFocus={resetTimer}
                    placeholder="No description (yet)"
                    className="text-xs h-full resize-none"
                  ></Textarea>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col justify-between">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveStop("up");
                }}
                disabled={stop.order_index === 0}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveStop("down");
                }}
                disabled={stop.order_index === totalStops - 1}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStopMutation.mutateAsync({
                    routeId: stop.route_id,
                    stopId: stop.id,
                  });
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex justify-end">
              {isDirty && <CloudOff className="text-orange-600" />}
              {!isDirty && <CloudCheck className="text-green-600" />}
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
