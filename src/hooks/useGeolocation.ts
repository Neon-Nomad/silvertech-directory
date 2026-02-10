import { useState } from 'react';
import { findNearestCity } from '../utils/geolocation';

interface GeolocationState {
    loading: boolean;
    error: string | null;
    coordinates: { lat: number; lng: number } | null;
    nearestCity: string | null;
}

const getStoredState = (): GeolocationState => {
    if (typeof window === 'undefined') {
        return { loading: false, error: null, nearestCity: null, coordinates: null };
    }

    const storedCity = localStorage.getItem('geo_city');
    const storedCoords = localStorage.getItem('geo_coords');

    let coords: { lat: number; lng: number } | null = null;
    if (storedCoords) {
        try {
            coords = JSON.parse(storedCoords);
        } catch {
            coords = null;
        }
    }

    return {
        loading: false,
        error: null,
        nearestCity: storedCity || null,
        coordinates: coords,
    };
};

export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>(getStoredState);

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

                if (typeof window !== 'undefined') {
                    localStorage.setItem('geo_city', city);
                    localStorage.setItem('geo_coords', JSON.stringify({ lat: latitude, lng: longitude }));
                    localStorage.setItem('geo_status', 'granted');
                }

                setState({
                    loading: false,
                    error: null,
                    nearestCity: city,
                    coordinates: { lat: latitude, lng: longitude }
                });
            },
            (error) => {
                if (typeof window !== 'undefined' && error.code === error.PERMISSION_DENIED) {
                    localStorage.setItem('geo_status', 'denied');
                }

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
