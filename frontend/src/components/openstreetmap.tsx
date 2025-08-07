import useInternetConnection from "@/hooks/useInternetConnection";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import {
  tileLayerOffline,
  savetiles,
  SaveStatus,
  getBlobByKey,
  downloadTile,
  saveTile,
} from "leaflet.offline";
import { Map, tileLayer } from "leaflet";
import { Badge } from "./ui/badge";

type OpenStreetMapProps = React.ComponentProps<typeof MapContainer>;

const urlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const baseLayer = tileLayer(urlTemplate, {
  attribution: "Map data {attribution.OpenStreetMap}",
  subdomains: "abc",
});
baseLayer.on("tileloadstart", (event) => {
  const { tile } = event;
  const url = tile.src;
  // reset tile.src, to not start download yet
  tile.src = "";
  getBlobByKey(url).then((blob) => {
    if (blob) {
      tile.src = URL.createObjectURL(blob);
      console.debug(`Loaded ${url} from idb`);
      return;
    }
    tile.src = url;
    // create helper function for it?
    const { x, y, z } = event.coords;
    const { _url: urlTemplate } = event.target;
    const tileInfo = {
      key: url,
      url,
      x,
      y,
      z,
      urlTemplate,
      createdAt: Date.now(),
    };
    downloadTile(url)
      .then((dl) => saveTile(tileInfo, dl))
      .then(() => console.debug(`Saved ${url} in idb`));
  });
});

export function OpenStreetMap({ children, ...props }: OpenStreetMapProps) {
  const hasConnection = useInternetConnection();
  const ref = useRef<Map>(null);

  useEffect(() => {
    if (ref.current) {
      baseLayer.addTo(ref.current);
    }
  }, [ref.current]);

  const setMapRef = (r: Map) => {
    ref.current = r;
    if (typeof props.ref === "object" && props.ref) {
      props.ref.current = r;
    } else if (typeof props.ref === "function") {
      props.ref(r);
    }
  };

  return (
    <MapContainer {...props} ref={setMapRef}>
      {!hasConnection && (
        <Badge variant={"destructive"} className="z-999 absolute right-2 top-2">
          Offline
        </Badge>
      )}
      {children}
    </MapContainer>
  );
}
