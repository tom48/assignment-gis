var startMark = null;
var endMark = null;
var map = null;
var layerGroup = null;
var waterSpeed = 2;

$(document).ready(function () {

// Create variable to hold map element, give initial settings to map
    map = L.map('map', {
        center: [48.216, 17.21742], zoom: 10,
        contextmenu: true, contextmenuWidth: 140,
        contextmenuItems: [{
            text: 'Add start point',
            callback: addStartPoint
        }, {
            text: 'Add end point',
            callback: addEndPoint
        }]
    });

// Add OpenStreetMap tile layer to map element
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        minZoom: 9,
        maxZoom: 17,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    map.bounds = [], map.setMaxBounds([[47.72646, 16.8284], [49.6186, 22.57051]]);

    layerGroup = L.layerGroup().addTo(map);
});

function addStartPoint(e) {
    if (startMark != null) map.removeLayer(startMark);

    $.ajax({
        method: 'GET',
        url: '/isRiver',
        data: {
            pointLat: e.latlng.lat,
            pointLon: e.latlng.lng
        },
        success: function(data) {
            if (data == "true") {
                startMark = new L.marker(e.latlng).addTo(map);
                startMark.bindPopup("Start point: " + e.latlng.toString()).openPopup();

                if (endMark != null) calculate_with_two_points();
            }
            else {
                alert('Point is not a part of river');
            }
        }
    });
}

function addEndPoint(e) {
    if (endMark != null) map.removeLayer(endMark);

    $.ajax({
        method: 'GET',
        url: '/isRiver',
        data: {
            pointLat: e.latlng.lat,
            pointLon: e.latlng.lng
        },
        success: function(data) {
            if (data == "true") {
                endMark = new L.marker(e.latlng).addTo(map);
                endMark.bindPopup("End point: " + e.latlng.toString()).openPopup();

                if (startMark != null) calculate_with_two_points();
            }
            else {
                alert('Point is not a part of river');
            }
        }
    });
}

function remove_all_marks(e) {
    if (startMark != null) {
        map.removeLayer(startMark);
        startMark = null;
    }

    if (endMark != null) {
        map.removeLayer(endMark);
        endMark = null;
    }
}

function remove_all_layers() {
    layerGroup.eachLayer(function (layer) {
        layerGroup.removeLayer(layer);
    });
}

function calculate_with_time() {
    remove_all_layers();

    if (startMark == null) {
        alert('Start point is not specified');
    }
    else {
        var time = document.getElementById('in_time');
        if (time.value == null || time.value == "") {
            alert('Time value is not specified');
        }
        else {
            var distance_from_time = Math.round(time.value * waterSpeed);
            $.ajax({
                method: 'GET',
                url: '/withTime',
                type: 'json',
                data: {
                    pointLat: startMark.getLatLng().lat,
                    pointLon: startMark.getLatLng().lng,
                    dist: distance_from_time
                },
                success: function (data) {
                    if (data.features != null) {
                        L.geoJson(data, {
                            onEachFeature: function (feature, layer) {
                                layer.bindPopup("distance: " + distance_from_time + " meters");
                            },
                            style: {
                                color: 'red',
                                weight: 6,
                                opacity: 0.5,
                                smoothFactor: 1
                            }
                        }).addTo(layerGroup);
                    }
                }
            });
        }
    }
}

function calculate_with_two_points() {
    remove_all_layers();

    $.ajax({
        method: 'GET',
        url: '/withTwoPoints',
        type: 'json',
        data: {
            pointLat1: startMark.getLatLng().lat,
            pointLon1: startMark.getLatLng().lng,
            pointLat2: endMark.getLatLng().lat,
            pointLon2: endMark.getLatLng().lng
        },
        success: function (data) {
            if (data.features != null) {
                var counter = 0;

                L.geoJson(data, {
                    onEachFeature: function (feature, layer) {
                        counter = Math.round(counter + parseInt(feature.properties.f2));
                        layer.bindPopup("distance: " + counter + " meters" +
                                "<br> sec: " + Math.round(counter / waterSpeed) +
                                "<br> min: " + (counter / (waterSpeed * 60)).toFixed(2) +
                                "<br> hours: " + (counter / (waterSpeed * 3600)).toFixed(2));
                    },
                    style: {
                        color: 'red',
                        weight: 6,
                        opacity: 0.5,
                        smoothFactor: 1
                    }
                }).addTo(layerGroup);
            }
        }
    });
}

function calculate_with_distance() {
    remove_all_layers();

    if (startMark == null) {
        alert('Start point is not specified');
    }
    else {
        var distance = document.getElementById('in_dist');
        if (distance.value == null || distance.value == "") {
            alert('Distance value is not specified');
        }
        else {
            $.ajax({
                method: 'GET',
                url: '/withDistance',
                type: 'json',
                data: {
                    pointLat: startMark.getLatLng().lat,
                    pointLon: startMark.getLatLng().lng,
                    dist: distance.value
                },
                success: function (data) {
                    if (data.features != null) {
                        L.geoJson(data, {
                            onEachFeature: function (feature, layer) {
                                layer.bindPopup("sec: " + Math.round(distance.value / waterSpeed) +
                                    "<br> min: " + (distance.value / (waterSpeed * 60)).toFixed(2) +
                                    "<br> hours: " + (distance.value / (waterSpeed * 3600)).toFixed(2));
                            },
                            style: {
                                color: 'red',
                                weight: 6,
                                opacity: 0.5,
                                smoothFactor: 1
                            }
                        }).addTo(layerGroup);
                    }
                }
            });
        }
    }
}