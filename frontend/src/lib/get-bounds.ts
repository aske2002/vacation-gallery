export default async function getBoundsFromCoordinatesa(
  coordinates: google.maps.LatLngLiteral[]
) {
  const coreLib = (await google.maps.importLibrary(
    "core"
  )) as google.maps.CoreLibrary;
  const bounds = new coreLib.LatLngBounds();
  coordinates.forEach((c) => bounds.extend(c));
  return bounds
}
