import { useState, useEffect } from "react";

interface GeolocationState {
  location: { latitude: number; longitude: number } | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const requestLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setState({
            location,
            error: null,
            loading: false,
          });
          resolve(location);
        },
        (error) => {
          setState({
            location: null,
            error,
            loading: false,
          });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const watchLocation = () => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setState(prev => ({
          ...prev,
          location,
          error: null,
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000, // 10 minutes
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  useEffect(() => {
    // Try to get location on mount if user has already granted permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation().catch(() => {
            // Silent fail - user can manually request location
          });
        }
      });
    }
  }, []);

  return {
    ...state,
    requestLocation,
    watchLocation,
  };
}
