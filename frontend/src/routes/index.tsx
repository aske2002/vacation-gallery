import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Api } from "@/api/synoApi";
import { AlbumItem } from "@/types/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Camera, Map } from "lucide-react";
import PhotoGrid from "@/components/photo-grid";
import { useQuery } from "@tanstack/react-query";
import { PhotoPreview } from "@/components/photo-preview";
import FAB from "@/components/fab";
import MapDialog from "@/components/map-dialog";
import MapComponent from "@/components/map-component";
import { usePhotos } from "@/hooks/useVacationGalleryApi";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  console.log(document.cookie);
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumItem | null>(null);
  const [showMap, setShowMap] = useState(false);

  const data = usePhotos();
  console.log("Photos data:", data);


  return (
    <div className="min-h-screen w-full flex flex-col gap-4">
      <MapDialog
        open={showMap}
        onClose={() => setShowMap(false)}
        onClickPhoto={setSelectedPhoto}
      />
      <Card className="pb-0 overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <span className="text-5xl">🇺🇸</span>
            <div>
              <CardTitle>I USA og Canada</CardTitle>
              <CardDescription>Med Aske og Hanne</CardDescription>
            </div>
            <span className="text-5xl">🇨🇦</span>
          </div>
        </CardHeader>
        <CardContent className="h-96 p-0">
          <MapComponent onClickPhoto={setSelectedPhoto}></MapComponent>
        </CardContent>
      </Card>

      {/* {photos && <PhotoGrid onClickPhoto={setSelectedPhoto} photos={photos} />} */}

      <PhotoPreview
        selectedPhoto={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
      <FAB Icon={Map} wiggle onClick={() => setShowMap(true)} />
    </div>
  );
}
