import { useState } from 'react';
import { findNearestCity } from '../utils/geolocation';

interface GeolocationState {
    loading: boolean;
    error: string | null;
    coordinates: { lat: number; lng: number } | null;
    nearestCity: string | null;
}

export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({
        loading: false,
        error: null,
        nearestCity: null,
        coordinates: null,
    });

    const getLocation = () => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const city = findNearestCity(latitude, longitude);

                setState({
                    loading: false,
                    error: null,
                    nearestCity: city,
                    coordinates: { lat: latitude, lng: longitude }
                });
            },
            (error) => {
                setState({
                    loading: false,
                    error: error.message,
                    nearestCity: null,
                    coordinates: null
                });
            }
        );
    };

    return { ...state, getLocation };
};
