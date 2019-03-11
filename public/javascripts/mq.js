const mqKey = 'Pqi6Z7PceCYcLTwUmqRxpOLT68Aypwl7';
L.mapquest.key = mqKey;


function initMap(center, divName, locatorControl = true) {
    let map = L.mapquest.map(divName, {
        center,
        layers: L.mapquest.tileLayer('map'),
        zoom: 12
    });

    if (locatorControl) {
        map.addControl(L.mapquest.locatorControl());
    }
    map.addLayer(L.mapquest.trafficLayer());
    return map;
}

async function getGeocodeForInputAddress(address) {
    let response = await fetch(`https://www.mapquestapi.com/geocoding/v1/address?key=${mqKey}&inFormat=kvp&outFormat=json&location=${address}&thumbMaps=false&maxResults=1`);
    let data = await response.json();
    let latlng = data.results[0].locations[0].latLng;
    return latlng;
}

function addDirections(start, dest, otherDest, map) {
    console.log('dest:');
    console.log(dest);
    console.log([dest.SurfaceLat, dest.SurfaceLong].join(','));
    let waypoints = otherDest.map((other) => {
        return [other.SurfaceLat, other.SurfaceLong].join(',');
    });
    let directions = L.mapquest.directions();
    directions.route({
        start,
        end: [dest.SurfaceLat, dest.SurfaceLong].join(','),
        waypoints,
        options: {
            enhancedNarrative: true
        }
    }, (err, response) => {
        console.log('Direction response route: ');
        console.log(response);
        //Directions Layer
        let directionsLayer = L.mapquest.directionsLayer({
            directionsResponse: response,
            paddingBottomRight: [400, 0],
        }).addTo(map);
        //Narrative Layer
        let narrativeControl = L.mapquest.narrativeControl({
            directionsResponse: response,
            compactResults: true,
            interactive: true
        });
        narrativeControl.setDirectionsLayer(directionsLayer);
        narrativeControl.addTo(map);
        //Custom Markers
        otherDest.forEach((other) => {
            L.mapquest.textMarker([other.SurfaceLat, other.SurfaceLong], {
                text: other.WellNum,
                subtext: other.LeaseName,
                type: 'via',
                icon: {
                    primaryColor: '#333333',
                    secondaryColor: '#333333',
                    size: 'sm'
                },
                position: 'left'
            }).addTo(map);
        });
        L.mapquest.textMarker([dest.SurfaceLat, dest.SurfaceLong], {
            text: dest.WellNum,
            subtext: dest.LeaseName,
            type: 'via',
            icon: {
                primaryColor: '#333333',
                secondaryColor: '#333333',
                size: 'sm'
            },
            position: 'left'
        }).addTo(map);
    });
}

function wrapper(fn) {
    return new Promise((resolve, reject) => {




    });
}