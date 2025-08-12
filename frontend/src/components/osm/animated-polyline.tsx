import React, { useEffect, useRef, useState } from "react";
import { Polyline } from "react-leaflet";
import L from "leaflet";

interface AnimatedPolylineProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  duration?: number; // in ms
}

const AnimatedPolyline: React.FC<AnimatedPolylineProps> = ({
  positions,
  color = "#2b7fff",
  weight = 5,
  duration = 2000
}) => {
  
  const [displayedPositions, setDisplayedPositions] = useState<
    [number, number][]
  >([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!positions || positions.length < 2) return;

    const totalDistance = positions.reduce((acc, curr, idx) => {
      if (idx === 0) return 0;
      return acc + L.latLng(curr).distanceTo(L.latLng(positions[idx - 1]));
    }, 0);

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const targetDistance = totalDistance * progress;

      let accumulated = 0;
      const newPositions: [number, number][] = [positions[0]];

      for (let i = 1; i < positions.length; i++) {
        const segmentDistance = L.latLng(positions[i]).distanceTo(
          L.latLng(positions[i - 1])
        );

        if (accumulated + segmentDistance < targetDistance) {
          newPositions.push(positions[i]);
          accumulated += segmentDistance;
        } else {
          const remaining = targetDistance - accumulated;
          const ratio = remaining / segmentDistance;
          const [lat1, lng1] = positions[i - 1];
          const [lat2, lng2] = positions[i];
          const lat = lat1 + (lat2 - lat1) * ratio;
          const lng = lng1 + (lng2 - lng1) * ratio;
          newPositions.push([lat, lng]);
          break;
        }
      }

      setDisplayedPositions(newPositions);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    setDisplayedPositions([positions[0]]);
    startTimeRef.current = null;
    requestAnimationFrame(step);
  }, [positions, duration]);

  return (
    <Polyline positions={displayedPositions} color={color} weight={weight} />
  );
};

export default AnimatedPolyline;
