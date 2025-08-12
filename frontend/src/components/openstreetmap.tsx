import useInternetConnection from "@/hooks/useInternetConnection";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { getBlobByKey, downloadTile, saveTile } from "leaflet.offline";
import L from "leaflet";
import { Map, TileEvent } from "leaflet";
import { Badge } from "./ui/badge";
import { initSmoothWheelZoom } from "./osm/zoom-controller";

type OpenStreetMapProps = React.ComponentProps<typeof MapContainer>;

const urlTemplate =
  "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}";

const parkStyle = {
  color: "#A22323", // Forest green
  weight: 2,
  fillOpacity: 0.2,
};

initSmoothWheelZoom();

export function OpenStreetMap({ children, ...props }: OpenStreetMapProps) {
  const hasConnection = useInternetConnection();

  const tileLoadStart = (event: TileEvent) => {
    const { tile } = event;
    const url = tile.src;
    tile.src = "";
    getBlobByKey(url).then((blob) => {
      if (blob) {
        tile.src = URL.createObjectURL(blob);
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
      downloadTile(url).then((dl) => saveTile(tileInfo, dl));
    });
  };

  return hasConnection ? (
    <MapContainer
      {...props}
      zoomSnap={0}
      zoomAnimation={true}
      preferCanvas={true}
      zoomDelta={20}
      scrollWheelZoom={false}
      smoothWheelZoom={true}
      smoothSensitivity={5}
    >
      <TileLayer
        url={urlTemplate}
        attribution={
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        }
        maxZoom={20}
        minZoom={0}
        eventHandlers={{
          tileloadstart: tileLoadStart,
        }}
        //@ts-ignore
        ext="png"
        //@ts-ignore
        accessToken="pk.eyJ1IjoiYXNrZTExMzEiLCJhIjoiY21lM3pjY2l0MGMzejJtc2Jra3llbTVudCJ9.hswgAAtfWRSwU1vZOhn6PA"
      />
      {!hasConnection && (
        <Badge variant={"destructive"} className="z-999 absolute right-2 top-2">
          Offline
        </Badge>
      )}
      {children}
      {/* <SmoothWheelZoom sensitivity={1 / 110} decay={0.9} /> */}
    </MapContainer>
  ) : (
    <div></div>
  );
}
