import React, { useCallback, useEffect, useMemo } from "react";
import Supercluster, { ClusterProperties, PointFeature } from "supercluster";
import { useSupercluster } from "../../../hooks/use-supercluster";
import { Feature, FeatureCollection, Point } from "geojson";
import { Marker, useMapEvents } from "react-leaflet";
import { Badge } from "../../ui/badge";
import { api } from "@/api/api";
import { Photo } from "@common/types/photo";
import L from "leaflet";

const clusterTranslation = 8;

type ClusteredMarkersOSMProps = {
  geojson: FeatureCollection<Point, Photo>;
  setNumClusters: (n: number) => void;
  setInfowindowData: (
    data: {
      position: [number, number];
      features: Feature<Point, Photo>[];
    } | null
  ) => void;
};

const superclusterOptions: Supercluster.Options<Photo, ClusterProperties> = {
  extent: 256,
  radius: 80,
  maxZoom: 12,
};

export const ClusteredMarkersOSM = ({
  geojson,
  setNumClusters,
  setInfowindowData,
}: ClusteredMarkersOSMProps) => {
  const { clusters, getLeaves } = useSupercluster(geojson, superclusterOptions);

  useEffect(() => {
    setNumClusters(clusters.length);
  }, [setNumClusters, clusters.length]);

  const handleClusterClick = useCallback(
    (position: [number, number], clusterId: number) => {
      const leaves = getLeaves(clusterId);
      setInfowindowData({ position, features: leaves });
    },
    [getLeaves, setInfowindowData]
  );

  const handleMarkerClick = useCallback(
    (position: [number, number], featureId: string) => {
      const feature = clusters.find((feat) => feat.id === featureId) as Feature<
        Point,
        Photo
      >;
      setInfowindowData({ position, features: [feature] });
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
          <PhotoClusterMarkerOSM
            key={feature.id}
            clusterId={clusterProperties.cluster_id}
            size={clusterProperties.point_count}
            sizeAsText={String(clusterProperties.point_count_abbreviated)}
            onMarkerClick={handleClusterClick}
            position={[lat, lng]}
            photos={getLeaves(typeof feature.id === "number" ? feature.id : 0)}
          />
        ) : (
          <PhotoMarkerOSM
            key={feature.id}
            featureId={feature.id as string}
            photo={feature.properties as Photo}
            onMarkerClick={handleMarkerClick}
          />
        );
      })}
    </>
  );
};

interface PhotoMarkerOSMProps {
  photo: Photo;
  featureId: string;
  onMarkerClick?: (
    position: [number, number],
    featureId: string
  ) => void;
}

const PhotoMarkerOSM = ({ photo, onMarkerClick, featureId }: PhotoMarkerOSMProps) => {
  const position: [number, number] = useMemo(() => {
    return [photo.latitude || 0, photo.longitude || 0];
  }, [photo]);

  const handleClick = useCallback(() => {
    onMarkerClick && onMarkerClick(position, featureId);
  }, [onMarkerClick, position, featureId]);

  const photoIcon = useMemo(() => {
    return L.divIcon({
      html: createPhotoPin(photo),
      className: 'photo-marker-container',
      iconSize: [56, 56],
      iconAnchor: [28, 28],
      popupAnchor: [0, -28],
    });
  }, [photo]);

  return (
    <Marker
      position={position}
      icon={photoIcon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
};

interface PhotoClusterMarkerOSMProps {
  photos: PointFeature<Photo>[];
  position: [number, number];
  clusterId: number;
  onMarkerClick?: (
    position: [number, number],
    clusterId: number
  ) => void;
  size: number;
  sizeAsText: string;
}

const PhotoClusterMarkerOSM = ({
  photos,
  onMarkerClick,
  clusterId,
  size,
  position,
}: PhotoClusterMarkerOSMProps) => {
  const handleClick = useCallback(() => {
    onMarkerClick && onMarkerClick(position, clusterId);
  }, [onMarkerClick, position, clusterId]);

  const markerSize = Math.floor(48 + Math.sqrt(size) * 2);
  const firstThreePhotos = photos.slice(0, Math.min(3, photos.length));

  const clusterIcon = useMemo(() => {
    const photoPins = firstThreePhotos
      .map((photo, index) => 
        `<div class="cluster-photo" style="transform: translate(${index * clusterTranslation}px, ${index * clusterTranslation}px); z-index: ${size - index};">
          ${createPhotoPin(photo.properties)}
        </div>`
      )
      .join('');

    return L.divIcon({
      html: `<div class="photo-cluster-container">
        ${photoPins}
        <div class="cluster-badge">
          <span class="badge-content">+${photos.length}</span>
        </div>
      </div>`,
      className: 'photo-cluster-marker',
      iconSize: [markerSize, markerSize],
      iconAnchor: [markerSize / 2, markerSize / 2],
      popupAnchor: [0, -markerSize / 2],
    });
  }, [photos, size, markerSize, firstThreePhotos]);

  return (
    <Marker
      position={position}
      icon={clusterIcon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
};

// Helper function to create photo pin HTML
function createPhotoPin(photo: Photo): string {
  const url = api.getThumbnailUrl(photo.filename);
  return `<div class="photo-pin">
    <img src="${url}" class="photo-pin-image" alt="Photo" />
  </div>`;
}

// Add styles for the markers - Updated with better positioning
const markerStyles = `
  .photo-marker-container {
    background: transparent !important;
    border: none !important;
  }

  .photo-cluster-marker {
    background: transparent !important;
    border: none !important;
  }

  .photo-pin {
    width: 56px;
    height: 56px;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    border: 4px solid white;
    background-color: #4b5563;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s;
    position: relative;
  }

  .photo-pin:hover {
    transform: scale(1.05);
  }

  .photo-pin-image {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    display: block;
  }

  .photo-cluster-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .cluster-photo {
    position: absolute;
    top: 0;
    left: 0;
  }

  .photo-cluster-container:hover {
    transform: scale(1.05);
  }

  .cluster-badge {
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(50%, 50%);
    background-color: #3b82f6;
    color: white;
    border-radius: 9999px;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    z-index: 1000;
  }

  .badge-content {
    display: block;
    white-space: nowrap;
  }
`;

// Inject styles only once
if (typeof document !== 'undefined' && !document.getElementById('osm-marker-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'osm-marker-styles';
  styleElement.textContent = markerStyles;
  document.head.appendChild(styleElement);
}
