import { FeatureCollection } from 'geojson';

export type PowerPlant = {
    latitude: number;
    longitude: number;
    name: string;
};

export type MapData = {
    states: FeatureCollection;
    counties: FeatureCollection;
    powerPlants: FeatureCollection;
};
