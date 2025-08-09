import { DefaultLoader } from "@/components/default-loader";
import { RouteEditor } from "@/components/route/route-editor";
import { Button } from "@/components/ui/button";
import { useRoute } from "@/hooks/useVacationGalleryApi";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/$tripId/$routeId")({
  component: RouteComponentWrapper,
});

function RouteComponentWrapper() {
  const navigate = useNavigate();
  const { routeId, tripId } = Route.useParams();

  return (
    <div className="w-full flex flex-col">
      <div>
        <Button
          className="mb-2"
          variant={"link"}
          onClick={() =>
            navigate({ to: "/admin/$tripId", params: { tripId: tripId } })
          }
        >
          <ArrowLeft />
          Go back
        </Button>
      </div>
      <RouteComponent routeId={routeId} />
    </div>
  );
}

function RouteComponent({ routeId }: { routeId: string }) {
  const { data: route, isLoading, error } = useRoute(routeId);

  if (route) {
    return <RouteEditor route={route} />;
  } else if (isLoading) {
    return <DefaultLoader />;
  } else {
    return error ? (
      <div className="text-red-500">Error loading route: {error.message}</div>
    ) : (
      <div className="text-gray-500">No route found</div>
    );
  }
}
