import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export const HYDERABAD_ZONES = [
  { id: '500081', postal_code: '500081', locality: 'Madhapur & HITEC City', en: 'Madhapur & HITEC City (500081)', te: 'మాదాపూర్ & హైటెక్ సిటీ (500081)' },
  { id: '500033', postal_code: '500033', locality: 'Jubilee Hills', en: 'Jubilee Hills (500033)', te: 'జూబ్లీ హిల్స్ (500033)' },
  { id: '500034', postal_code: '500034', locality: 'Banjara Hills', en: 'Banjara Hills (500034)', te: 'బంజారా హిల్స్ (500034)' },
  { id: '500032', postal_code: '500032', locality: 'Gachibowli', en: 'Gachibowli (500032)', te: 'గచ్చిబౌలి (500032)' },
  { id: '500084', postal_code: '500084', locality: 'Kondapur', en: 'Kondapur (500084)', te: 'కొండాపూర్ (500084)' }
];

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [selectedZoneId, setSelectedZoneId] = useState(() => {
    return localStorage.getItem('alco_selected_zone') || HYDERABAD_ZONES[0].id;
  });

  const selectedZone = useMemo(
    () => HYDERABAD_ZONES.find((z) => z.id === selectedZoneId) || HYDERABAD_ZONES[0],
    [selectedZoneId]
  );

  useEffect(() => {
    localStorage.setItem('alco_selected_zone', selectedZoneId);
  }, [selectedZoneId]);

  const setZone = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
  }, []);

  const value = useMemo(
    () => ({
      selectedZoneId,
      selectedZone,
      postalCode: selectedZone.postal_code,
      setZone,
      allZones: HYDERABAD_ZONES
    }),
    [selectedZoneId, selectedZone, setZone]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
