/**
 * Reverse geocoding using OpenStreetMap Nominatim API
 * Returns a formatted address for the given coordinates
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=he`,
      {
        headers: {
          'User-Agent': 'TelAvivBicycleParking/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Geocoding error:', data.error);
      return null;
    }

    // Build a clean address from address components
    const address = data.address;
    const parts: string[] = [];

    // Street and house number
    if (address.road) {
      if (address.house_number) {
        parts.push(`${address.road} ${address.house_number}`);
      } else {
        parts.push(address.road);
      }
    }

    // Add city/town
    const city = address.city || address.town || address.municipality || address.village;
    if (city) {
      parts.push(city);
    }

    return parts.length > 0 ? parts.join(', ') : data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
