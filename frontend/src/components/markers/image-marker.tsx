import React, { Ref, useCallback, useEffect, useMemo } from "react";
import Supercluster, { ClusterProperties, PointFeature } from "supercluster";
import { useSupercluster } from "../../hooks/use-supercluster";
import { Feature, FeatureCollection, Point } from "geojson";
import { AlbumItem } from "@/types/api";
import { Api } from "@/api/synoApi";
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { Badge } from "../ui/badge";

const clusterTranslation = 8;

type ClusteredMarkersProps = {
  geojson: FeatureCollection<Point, AlbumItem>;
  setNumClusters: (n: number) => void;
  setInfowindowData: (
    data: {
      anchor: google.maps.marker.AdvancedMarkerElement;
      features: Feature<Point, AlbumItem>[];
    } | null
  ) => void;
};

const superclusterOptions: Supercluster.Options<AlbumItem, ClusterProperties> =
  {
    extent: 256,
    radius: 80,
    maxZoom: 12,
  };

export const ClusteredMarkers = ({
  geojson,
  setNumClusters,
  setInfowindowData,
}: ClusteredMarkersProps) => {
  const { clusters, getLeaves } = useSupercluster(geojson, superclusterOptions);

  useEffect(() => {
    setNumClusters(clusters.length);
  }, [setNumClusters, clusters.length]);

  const handleClusterClick = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
      const leaves = getLeaves(clusterId);

      setInfowindowData({ anchor: marker, features: leaves });
    },
    [getLeaves, setInfowindowData]
  );

  const handleMarkerClick = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
      const feature = clusters.find(
        (feat) => feat.id === featureId
      ) as Feature<Point, AlbumItem>;

      setInfowindowData({ anchor: marker, features: [feature] });
    },
    [clusters, setInfowindowData]
  );

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;

        const clusterProperties = feature.properties as ClusterProperties;
        const isCluster: boolean = clusterProperties.cluster;

        return isCluster ? (
          <PhotoClusterMarker
            key={feature.id}
            clusterId={clusterProperties.cluster_id}
            size={clusterProperties.point_count}
            sizeAsText={String(clusterProperties.point_count_abbreviated)}
            onMarkerClick={handleClusterClick}
            position={{ lat, lng }}
            photos={getLeaves(typeof feature.id === "number" ? feature.id : 0)}
          />
        ) : (
          <PhotoMarker
            key={feature.id}
            featureId={feature.id as string}
            photo={feature.properties as AlbumItem}
            onMarkerClick={handleMarkerClick}
          />
        );
      })}
    </>
  );
};

interface PhotoMarkerProps {
  photo: AlbumItem;
  featureId: string;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
}

const PhotoMarker = ({ photo, onMarkerClick, featureId }: PhotoMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const handleClick = useCallback(
    () => onMarkerClick && onMarkerClick(marker!, featureId),
    [onMarkerClick, marker, featureId]
  );
  const position = useMemo(() => {
    return {
      lat: photo.additional.gps?.latitude || 0,
      lng: photo.additional.gps?.longitude || 0,
    };
  }, [photo]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={handleClick}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      className={"marker feature"}
    >
      <PhotoPin photo={photo} />
    </AdvancedMarker>
  );
};

interface PhotoClusterMarkerProps {
  photos: PointFeature<AlbumItem>[];
  position: google.maps.LatLngLiteral;
  clusterId: number;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    clusterId: number
  ) => void;
  size: number;
  sizeAsText: string;
}

const PhotoClusterMarker = ({
  photos,
  onMarkerClick,
  clusterId,
  size,
  position,
}: PhotoClusterMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const handleClick = useCallback(
    () => onMarkerClick && onMarkerClick(marker!, clusterId),
    [onMarkerClick, marker, clusterId]
  );
  const markerSize = Math.floor(48 + Math.sqrt(size) * 2);
  const firstThreePhotos = photos.slice(0, Math.min(3, photos.length));

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={size}
      onClick={handleClick}
      className={"marker cluster"}
      style={{
        width: markerSize,
        height: markerSize,
      }}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
    >
      <div className="hover:scale-105 transition-transform relative w-full h-full shadow-xl">
        {firstThreePhotos.map((photo, index) => (
          <PhotoPin
            key={photo.id}
            photo={photo.properties}
            zIndex={size - index}
            transform={{
              x: index * clusterTranslation,
              y: index * clusterTranslation,
            }}
          />
        ))}
        <Badge
          variant={"secondary"}
          style={{ zIndex: size + 1 }}
          className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 bg-blue-500"
        >{`+${photos.length}`}</Badge>
      </div>
    </AdvancedMarker>
  );
};

interface PhotoPinProps {
  photo: AlbumItem;
  transform?: { x: number; y: number };
  zIndex?: number;
  onClick?: (photo: AlbumItem) => void;
}

const PhotoPin = React.forwardRef(
  (
    { photo, onClick, transform, zIndex }: PhotoPinProps,
    ref: Ref<HTMLDivElement>
  ) => {
    const url = useMemo(() => {
      return Api.getThumnailUrl(photo, "sm");
    }, [photo]);

    return (
      <div
        ref={ref}
        style={{
          transform: transform
            ? `translate(${transform.x}px,${transform.y}px)`
            : undefined,
          zIndex: zIndex,
        }}
        className="w-14 h-14 rounded-md overflow-hidden cursor-pointer absolute border-4 border-white bg-gray-600 shadow-md"
        onClick={() => onClick?.(photo)}
      >
        <img src={url} className="object-cover w-full h-full" />
      </div>
    );
  }
);
