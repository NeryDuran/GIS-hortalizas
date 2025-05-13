// Configuración de GeoServer
const geoserverUrl = 'http://3.142.197.190:8080/geoserver';
const workspace = 'hortalizas';

// Definición de capas con sus tipos geométricos
const layers = {
    fosforo: { name: 'fosforo', type: 'vector', geometry: 'polygon' },
    potasio: { name: 'potasio', type: 'vector', geometry: 'polygon' },
    ph: { name: 'ph suelo', type: 'vector', geometry: 'polygon' },
    tipo_suelo: { name: 'tipo suelo', type: 'vector', geometry: 'polygon' },
    precipitacion: { name: 'precipitacion', type: 'vector', geometry: 'polygon' },
    temperatura: {
        name: 'temperatura_media',
        type: 'raster',
        geometry: 'raster',
        customLegend: [
            { color: '#5bb3e6', label: '10.0 - 12.5°C' },
            { color: '#8cc3c7', label: '12.5 - 15.0°C' },
            { color: '#b7d7b0', label: '15.0 - 17.5°C' },
            { color: '#f3f3a1', label: '17.5 - 20.0°C' },
            { color: '#ffe37a', label: '20.0 - 22.5°C' },
            { color: '#ffc07a', label: '22.5 - 25.0°C' },
            { color: '#ff9a6e', label: '25.0 - 27.5°C' },
            { color: '#f26c6c', label: '27.5 - 30.0°C' }
        ]
    },
    elevacion: { name: 'elevacion', type: 'vector', geometry: 'polygon' },
    erosion: {
        name: 'erosion',
        type: 'raster',
        geometry: 'raster',
        customLegend: [
            { color: '#f26c6c', label: 'Riesgo muy alto' },
            { color: '#ff9a6e', label: 'Riesgo alto' },
            { color: '#ffe37a', label: 'Riesgo moderado' },
            { color: '#b7d7b0', label: 'Riesgo bajo' }
        ]
    },
    red_vial: { name: 'red vial', type: 'vector', geometry: 'line' },
    rios: { name: 'rios principales', type: 'vector', geometry: 'line' },
    areas_urbanas: { name: 'areas urbanas', type: 'vector', geometry: 'polygon' },
    departamentos: { name: 'departamentos', type: 'vector', geometry: 'polygon' },
    distritos: { name: 'distritos', type: 'vector', geometry: 'polygon' },
    areas_conservacion: { name: 'areas conservacion', type: 'vector', geometry: 'polygon' },
    sitios_contaminados: { name: 'sitios contaminados', type: 'vector', geometry: 'point' }
};

// Orden de visualización de capas (de más atrás a más adelante)
const layerOrder = {
    'raster': 0,
    'polygon': 1,
    'line': 2,
    'point': 3
};

// Inicialización del mapa OpenLayers
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-88.914068, 13.794185]),
        zoom: 8
    })
});

// Función para crear capas WMS en OpenLayers
function createWMSLayer(layerName, geometryType) {
    return new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: `${geoserverUrl}/${workspace}/wms`,
            params: {
                'LAYERS': `${workspace}:${layerName}`,
                'TILED': true
            },
            serverType: 'geoserver'
        }),
        visible: false,
        zIndex: layerOrder[geometryType] || 0
    });
}

// Agregar todas las capas al mapa OpenLayers
const olLayers = {};
Object.entries(layers).forEach(([id, layer]) => {
    const olLayer = createWMSLayer(layer.name, layer.geometry);
    olLayer.set('name', id);
    map.addLayer(olLayer);
    olLayers[id] = olLayer;
});

// Función para reordenar las capas activas
function reorderActiveLayers() {
    const activeLayers = map.getLayers().getArray()
        .filter(layer => layer.getVisible() && layer.get('name'))
        .sort((a, b) => {
            const layerA = layers[a.get('name')];
            const layerB = layers[b.get('name')];
            return layerOrder[layerA.geometry] - layerOrder[layerB.geometry];
        });

    // Reordenar las capas en el mapa
    activeLayers.forEach((layer, index) => {
        layer.setZIndex(layerOrder[layers[layer.get('name')].geometry]);
    });
}

// Función para obtener la leyenda de una capa
function getLayerLegend(layerName) {
    return `${geoserverUrl}/${workspace}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${workspace}:${layerName}&STYLE=&TRANSPARENT=true`;
}

// Función para crear el contenedor de leyenda
function createLegendContainer(layerName, layerTitle) {
    // Busca la capa por nombre
    const layerKey = Object.keys(layers).find(key => layers[key].name === layerName);
    const layer = layers[layerKey];

    let legendContentHtml = '';
    if (layer.customLegend) {
        legendContentHtml = '<div class="custom-legend">';
        layer.customLegend.forEach(item => {
            legendContentHtml += `
                <div class="custom-legend-item">
                    <span class="custom-legend-symbol" style="background:${item.color}"></span>
                    <span class="custom-legend-label">${item.label}</span>
                </div>
            `;
        });
        legendContentHtml += '</div>';
    } else {
        const legendUrl = getLayerLegend(layerName);
        legendContentHtml = `<img src="${legendUrl}" alt="Leyenda de ${layerTitle}">`;
    }

    const container = document.createElement('div');
    container.className = 'layer-legend';
    container.innerHTML = `
        <div class="legend-header">
            <span class="legend-title">Simbología</span>
            <button class="toggle-legend">
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
        <div class="legend-content">
            ${legendContentHtml}
        </div>
    `;
    return container;
}

// Control de capas mejorado
document.querySelectorAll('.form-check-input').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const layerId = this.id;
        const layer = olLayers[layerId];
        
        if (layer) {
            layer.setVisible(this.checked);
            reorderActiveLayers();
            
            // Obtener el contenedor del checkbox
            const checkboxContainer = this.closest('.form-check');
            
            if (this.checked) {
                // Crear y agregar la leyenda
                const layerTitle = this.nextElementSibling.textContent.trim();
                const legendContainer = createLegendContainer(layers[layerId].name, layerTitle);
                checkboxContainer.appendChild(legendContainer);
                
                // Agregar evento para contraer/expandir
                const toggleButton = legendContainer.querySelector('.toggle-legend');
                const legendContent = legendContainer.querySelector('.legend-content');
                
                toggleButton.addEventListener('click', function() {
                    const isExpanded = legendContent.style.display !== 'none';
                    legendContent.style.display = isExpanded ? 'none' : 'block';
                    this.querySelector('i').className = isExpanded ? 
                        'fas fa-chevron-right' : 'fas fa-chevron-down';
                });
            } else {
                // Remover la leyenda cuando se desactiva la capa
                const legendToRemove = checkboxContainer.querySelector('.layer-legend');
                if (legendToRemove) {
                    legendToRemove.remove();
                }
            }
        }
    });
});

// Búsqueda de capas mejorada
document.getElementById('layerSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const layerGroups = document.querySelectorAll('.layer-group');
    
    layerGroups.forEach(group => {
        const checks = group.querySelectorAll('.form-check');
        let hasVisibleChecks = false;
        
        checks.forEach(check => {
            const label = check.querySelector('label').textContent.toLowerCase();
            const isMatch = label.includes(searchTerm);
            check.style.display = isMatch ? 'block' : 'none';
            if (isMatch) hasVisibleChecks = true;
        });
        
        // Mostrar/ocultar el grupo completo
        group.style.display = hasVisibleChecks ? 'block' : 'none';
    });
});

// Inicialización de Cesium
const cesiumContainer = document.createElement('div');
cesiumContainer.id = 'cesiumContainer';
cesiumContainer.style.display = 'none';
cesiumContainer.style.width = '100%';
cesiumContainer.style.height = '100%';
document.getElementById('map').appendChild(cesiumContainer);

// Asegurarse de que el token de Cesium esté configurado
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyMjY0NjQ5OH0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZvY';

const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false
});

// Centrar la vista en El Salvador
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-88.914068, 13.794185, 100000),
    orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
    }
});

// Control 3D mejorado
document.getElementById('toggle3D').addEventListener('click', function() {
    const mapDiv = document.getElementById('map');
    const cesiumDiv = document.getElementById('cesiumContainer');
    
    if (cesiumDiv.style.display === 'none') {
        mapDiv.style.display = 'none';
        cesiumDiv.style.display = 'block';
        viewer.scene.globe.enableLighting = true;
        // Forzar actualización de la vista
        viewer.scene.requestRender();
    } else {
        mapDiv.style.display = 'block';
        cesiumDiv.style.display = 'none';
    }
});

// Animación de entrada para los elementos
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.layer-group');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}); 