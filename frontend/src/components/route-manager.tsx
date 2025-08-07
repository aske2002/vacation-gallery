import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteList } from "@/components/route-list";
import { RouteEditorWithMap } from "@/components/route-editor-with-map";
import { RouteWithStops } from "@common/types/route";
import {
  useCreateRoute,
  useRoute,
  useTripRoutes,
} from "@/hooks/useVacationGalleryApi";

interface RouteManagerProps {
  tripId: string;
  onBack?: () => void;
}

export function RouteManager({ tripId, onBack }: RouteManagerProps) {
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const { data: allRoutes } = useTripRoutes(tripId);

  const editingRoute = useMemo(() => {
    if (!editingRouteId) return null;
    return allRoutes?.find((route) => route.id === editingRouteId) || null;
  }, [editingRouteId, allRoutes]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const createRouteMutation = useCreateRoute();

  const handleCreateRoute = async () => {
    const { id } = await createRouteMutation.mutateAsync({
      trip_id: tripId,
      title: "My New Route",
      description: "",
      profile: "driving-car",
      stops: [],
    });
    setEditingRouteId(id);
  };

  const handleEditRoute = (routeId: string) => {
    setEditingRouteId(routeId);
  };

  const handleCancelEdit = () => {
    setEditingRouteId(null);
  };

  const handleDeleteRoute = (routeId: string) => {
    setEditingRouteId(null);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh of the route list
  };

  return (
    <div className="">
      {!editingRoute && (
        <RouteList
          tripId={tripId}
          onCreateRoute={handleCreateRoute}
          onEditRoute={handleEditRoute}
          refreshTrigger={refreshTrigger}
        />
      )}

      {editingRouteId && (
        <RouteEditorWithMap
          routeId={editingRouteId}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteRoute}
        />
      )}
    </div>
  );
}
