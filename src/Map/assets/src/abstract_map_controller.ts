import { Controller } from '@hotwired/stimulus';

export type Point = { lat: number; lng: number };

export type MapView<Options, MarkerOptions, InfoWindowOptions> = {
    center: Point;
    zoom: number;
    fitBoundsToMarkers: boolean;
    markers: Array<MarkerDefinition<MarkerOptions, InfoWindowOptions>>;
    options: Options;
};

export type MarkerDefinition<MarkerOptions, InfoWindowOptions> = {
    position: Point;
    title: string | null;
    infoWindow?: Omit<InfoWindowDefinition<InfoWindowOptions>, 'position'>;
    rawOptions?: MarkerOptions;
};

export type InfoWindowDefinition<InfoWindowOptions> = {
    headerContent: string | null;
    content: string | null;
    position: Point;
    opened: boolean;
    autoClose: boolean;
    rawOptions?: InfoWindowOptions;
};

export default abstract class<
    MapOptions,
    Map,
    MarkerOptions,
    Marker,
    InfoWindowOptions,
    InfoWindow,
> extends Controller<HTMLElement> {
    static values = {
        providerOptions: Object,
        view: Object,
    };

    declare viewValue: MapView<MapOptions, MarkerOptions, InfoWindowOptions>;

    protected map: Map;
    protected markers: Array<Marker> = [];
    protected infoWindows: Array<InfoWindow> = [];

    initialize() {}

    connect() {
        const { center, zoom, options, markers, fitBoundsToMarkers } = this.viewValue;

        this.dispatchEvent('pre-connect', { options });

        this.map = this.doCreateMap({ center, zoom, options });

        markers.forEach((marker) => this.createMarker(marker));

        if (fitBoundsToMarkers) {
            this.doFitBoundsToMarkers();
        }

        this.dispatchEvent('connect', {
            map: this.map,
            markers: this.markers,
            infoWindows: this.infoWindows,
        });
    }

    protected abstract doCreateMap({
        center,
        zoom,
        options,
    }: {
        center: Point;
        zoom: number;
        options: MapOptions;
    }): Map;

    public createMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker {
        this.dispatchEvent('marker:before-create', { definition });
        const marker = this.doCreateMarker(definition);
        this.dispatchEvent('marker:after-create', { marker });

        this.markers.push(marker);

        return marker;
    }

    protected abstract doCreateMarker(definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>): Marker;

    protected createInfoWindow({
        definition,
        marker,
    }: {
        definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>['infoWindow'];
        marker: Marker;
    }): InfoWindow {
        this.dispatchEvent('info-window:before-create', { definition, marker });
        const infoWindow = this.doCreateInfoWindow({ definition, marker });
        this.dispatchEvent('info-window:after-create', { infoWindow, marker });

        this.infoWindows.push(infoWindow);

        return infoWindow;
    }

    protected abstract doCreateInfoWindow({
        definition,
        marker,
    }: {
        definition: MarkerDefinition<MarkerOptions, InfoWindowOptions>['infoWindow'];
        marker: Marker;
    }): InfoWindow;

    protected abstract doFitBoundsToMarkers(): void;

    private dispatchEvent(name: string, payload: Record<string, unknown> = {}): void {
        this.dispatch(name, { prefix: 'ux:map', detail: payload });
    }
}
