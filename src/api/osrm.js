import axios from 'axios';

/**
 *
 * profile: 'driving', 'walking', 'cycling'
 *
 * @returns { geometry: [ [lat, lon], ...], distance, duration }
 */
export async function getRoute(origin, destination, profile = 'driving') {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;

  const url = `https://router.project-osrm.org/route/v1/${profile}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`;

  const res = await axios.get(url);

  const data = res.data.routes?.[0];
  if (!data) return null;

  // Extract turn-by-turn instructions
  const steps = data.legs?.[0]?.steps?.map(step => ({
    instruction: step.maneuver?.modifier ?
      `${step.maneuver.type} ${step.maneuver.modifier}` :
      step.maneuver?.type || 'continue',
    distance: step.distance,
    duration: step.duration,
    name: step.name || 'unnamed road'
  })) || [];

  return {
    coordinates: data.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distance: data.distance,      // meters
    duration: data.duration,      // seconds
    steps                         // turn-by-turn instructions
  };
}
