import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Form,
  FormMessage,
} from "../ui/form";
import DateInput from "../ui/date-input";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useCreateTrip } from "@/hooks/useVacationGalleryApi";
import { create } from "domain";
import { LoadingButton } from "../loading-button";
import {
  CreateTripRequest,
  CreateTripRequestSchema,
} from "@common/types/request/create-trip-request";

interface CreateTripDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (tripId: string) => void;
}

export default function CreateTripDialog({
  open,
  onClose,
  onCreated,
}: CreateTripDialogProps) {
  const form = useForm<CreateTripRequest>({
    resolver: zodResolver(CreateTripRequestSchema),
    defaultValues: {
      name: "",
      description: "",
      start_date: new Date().toISOString(),
      end_date: undefined,
    },
  });

  const { mutateAsync: createTrip } = useCreateTrip();

  const onSubmit = async (data: CreateTripRequest) => {
    await createTrip(data);
    onCreated?.(data.name);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="input"
                      placeholder="Enter trip name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="input"
                      placeholder="Enter trip description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <DateInput
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString())}
                      className="grow w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <DateInput
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString())}
                      className="grow w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                loading={form.formState.isSubmitting}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Trip
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
