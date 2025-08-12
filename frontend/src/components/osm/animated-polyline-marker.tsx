import React, { useEffect, useMemo, useRef, useState } from "react";
import { Polyline, Marker, useMap } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { renderToString } from "react-dom/server";
import { MapZIndexes } from "@/lib/map-indexes";

interface AnimatedPolylineWithMarkerProps {
  positions: LatLngTuple[];
  color?: string;
  weight?: number;
  /** Duration for the whole route (if it ran 0% -> 100%) */
  totalDuration?: number; // ms
  iconSize?: [number, number];
  /** Target progress along the route. Accepts 0–1 or 0–100. */
  progress?: number;
  /** Color for the remaining (after-progress) segment */
  remainingColor?: string;
  markerZIndex?: number;
  children?: React.ReactNode;
  onFinish?: () => void;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const normalizeProgress = (p?: number) =>
  p == null ? 1 : clamp01(p > 1 ? p / 100 : p);

function pathLength(pts: LatLngTuple[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += L.latLng(pts[i]).distanceTo(L.latLng(pts[i - 1]));
  }
  return total;
}

function partialPolylineByDistance(
  pts: LatLngTuple[],
  targetDistance: number
): { polyline: LatLngTuple[]; point: LatLngTuple } {
  if (pts.length <= 1) return { polyline: pts, point: pts[0] };
  let acc = 0;
  const out: LatLngTuple[] = [pts[0]];
  let current = pts[0];

  for (let i = 1; i < pts.length; i++) {
    const seg = L.latLng(pts[i]).distanceTo(L.latLng(pts[i - 1]));
    if (acc + seg < targetDistance) {
      out.push(pts[i]);
      acc += seg;
    } else {
      const remain = targetDistance - acc;
      const ratio = seg === 0 ? 0 : remain / seg;
      const [lat1, lng1] = pts[i - 1];
      const [lat2, lng2] = pts[i];
      current = [lat1 + (lat2 - lat1) * ratio, lng1 + (lng2 - lng1) * ratio];
      out.push(current);
      return { polyline: out, point: current };
    }
  }
  return { polyline: pts.slice(), point: pts[pts.length - 1] };
}

function splitRouteAtFraction(positions: LatLngTuple[], frac: number) {
  const total = pathLength(positions);
  const target = total * clamp01(frac);
  const { polyline: completed, point: markerPos } = partialPolylineByDistance(
    positions,
    target
  );

  // Build remaining starting from markerPos to end
  let splitIndex = positions.length - 1;
  let acc = 0;
  for (let i = 1; i < positions.length; i++) {
    const seg = L.latLng(positions[i]).distanceTo(L.latLng(positions[i - 1]));
    if (acc + seg >= target) {
      splitIndex = i;
      break;
    }
    acc += seg;
  }
  const remaining =
    splitIndex >= positions.length - 1 ? [] : [markerPos, ...positions.slice(splitIndex)];
  return { completed, remaining, markerPos, totalDistance: total };
}

const AnimatedPolylineWithMarker: React.FC<AnimatedPolylineWithMarkerProps> = ({
  positions,
  color = "#2b7fff",
  markerZIndex,
  onFinish,
  weight = 5,
  totalDuration = 4000,
  children,
  iconSize = [32, 32],
  progress: progressProp,
  remainingColor = "#565656",
}) => {
  const map = useMap();
  const targetFrac = normalizeProgress(progressProp);

  const [completedDisplay, setCompletedDisplay] = useState<LatLngTuple[]>([]);
  const [tailDisplay, setTailDisplay] = useState<LatLngTuple[]>([]);
  const [markerPos, setMarkerPos] = useState<LatLngTuple | null>(null);

  const mainRaf = useRef<number | null>(null);
  const tailRaf = useRef<number | null>(null);
  const mainStartRef = useRef<number | null>(null);
  const tailStartRef = useRef<number | null>(null);

  const mainPausedElapsedRef = useRef<number>(0);
  const tailPausedElapsedRef = useRef<number>(0);

  const isZoomingRef = useRef<boolean>(false); // pause flag
  const mainDoneRef = useRef<boolean>(false);
  const tailActiveRef = useRef<boolean>(false);

  const carIcon = useMemo(() => {
    const content = renderToString(children);
    return L.divIcon({
      html: `<div class="animated-marker-container relative" style="${
        markerZIndex ? `z-index: ${markerZIndex}` : ""
      }">${content}</div>`,
      className: "animated-marker",
      iconSize,
      iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    });
  }, [children, iconSize, markerZIndex]);

  useEffect(() => {
    if (!positions || positions.length < 2) return;

    const { completed, remaining, markerPos: markerAtTarget } = splitRouteAtFraction(
      positions,
      targetFrac
    );

    setTailDisplay([]);
    setMarkerPos(positions[0]);
    setCompletedDisplay([positions[0]]);

    const totalDist = pathLength(positions);
    const speed = totalDist / totalDuration; // meters per ms
    const targetDist = totalDist * targetFrac;
    const mainDuration = targetDist / speed;
    const tailTotal = pathLength(remaining);
    const tailDuration = tailTotal / speed;

    mainDoneRef.current = false;
    tailActiveRef.current = false;
    mainPausedElapsedRef.current = 0;
    tailPausedElapsedRef.current = 0;

    const mainStep = (ts: number) => {
      // set/refit start time considering any paused elapsed
      if (mainStartRef.current == null) mainStartRef.current = ts - mainPausedElapsedRef.current;

      const elapsed = ts - mainStartRef.current;

      // pause during zoom
      if (isZoomingRef.current) {
        mainPausedElapsedRef.current = Math.min(elapsed, mainDuration);
        if (mainRaf.current) cancelAnimationFrame(mainRaf.current);
        mainRaf.current = null;
        return;
      }

      const f = mainDuration > 0 ? Math.min(elapsed / mainDuration, 1) : 1;
      const dist = targetDist * f;

      const { polyline, point } = partialPolylineByDistance(positions, dist);
      setCompletedDisplay(polyline);
      setMarkerPos(point);

      if (f < 1) {
        mainRaf.current = requestAnimationFrame(mainStep);
      } else {
        mainDoneRef.current = true;
        setCompletedDisplay(completed);
        setMarkerPos(markerAtTarget);

        if (remaining.length > 1) {
          tailActiveRef.current = true;
          tailStartRef.current = null;
          tailPausedElapsedRef.current = 0;
          tailRaf.current = requestAnimationFrame(tailStep);
        } else {
          tailActiveRef.current = false;
          onFinish && onFinish();
        }
      }
    };

    const tailStep = (ts2: number) => {
      if (tailStartRef.current == null) tailStartRef.current = ts2 - tailPausedElapsedRef.current;

      const elapsed2 = ts2 - tailStartRef.current;

      if (isZoomingRef.current) {
        tailPausedElapsedRef.current = Math.min(elapsed2, tailDuration);
        if (tailRaf.current) cancelAnimationFrame(tailRaf.current);
        tailRaf.current = null;
        return;
      }

      const f2 = tailDuration > 0 ? Math.min(elapsed2 / tailDuration, 1) : 1;
      const dist2 = tailTotal * f2;

      const { polyline: tailPart } = partialPolylineByDistance(remaining, dist2);
      setTailDisplay(tailPart);

      if (f2 < 1) {
        tailRaf.current = requestAnimationFrame(tailStep);
      } else {
        tailActiveRef.current = false;
        setTailDisplay(remaining);
        onFinish && onFinish();
      }
      
    };

    // start / restart
    mainStartRef.current = null;
    tailStartRef.current = null;
    if (mainRaf.current) cancelAnimationFrame(mainRaf.current);
    if (tailRaf.current) cancelAnimationFrame(tailRaf.current);
    mainRaf.current = requestAnimationFrame(mainStep);

    // zoom handlers
    const onZoomStart = () => {
      isZoomingRef.current = true;
    };

    const onZoomEnd = () => {
      isZoomingRef.current = false;

      // resume whichever phase is active
      if (!mainDoneRef.current) {
        if (!mainRaf.current) {
          mainStartRef.current = null; // let it recalc with paused elapsed
          mainRaf.current = requestAnimationFrame(mainStep);
        }
      } else if (tailActiveRef.current) {
        if (!tailRaf.current) {
          tailStartRef.current = null;
          tailRaf.current = requestAnimationFrame(tailStep);
        }
      }
    };

    map.on("zoomstart", onZoomStart);
    map.on("zoomend", onZoomEnd);

    return () => {
      map.off("zoomstart", onZoomStart);
      map.off("zoomend", onZoomEnd);
      if (mainRaf.current) cancelAnimationFrame(mainRaf.current);
      if (tailRaf.current) cancelAnimationFrame(tailRaf.current);
      mainRaf.current = null;
      tailRaf.current = null;
    };
  }, [map, positions, totalDuration, targetFrac, remainingColor, color, weight]);

  return (
    <>
      {completedDisplay.length > 1 && (
        <Polyline positions={completedDisplay} color={color} weight={weight} />
      )}
      {tailDisplay.length > 1 && (
        <Polyline positions={tailDisplay} color={remainingColor} weight={weight} />
      )}
      {markerPos && (
        <Marker
          position={markerPos}
          icon={carIcon}
          zIndexOffset={MapZIndexes.tripMarker}
        />
      )}
    </>
  );
};

export default AnimatedPolylineWithMarker;
