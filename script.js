// Configuración de GeoServer
const geoserverUrl = 'https://hortalizas.shop/geoserver';
const workspace = 'hortalizas';

// Definición de capas con sus tipos geométricos
const layers = {
    fosforo: { name: 'fosforo', type: 'vector', geometry: 'polygon' },
    potasio: { name: 'potasio', type: 'vector', geometry: 'polygon' },
    ph: { name: 'ph del suelo', type: 'vector', geometry: 'polygon' },
    tipo_suelo: { name: 'tipo de suelo', type: 'vector', geometry: 'polygon' },
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
        name: 'erosión',
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
    areas_conservacion: { name: 'areas de conservacion', type: 'vector', geometry: 'polygon' },
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
        center: ol.proj.fromLonLat([-89.2182, 13.6929]),
        zoom: 8
    })
});

// Función para crear capas WMS en OpenLayers
function createWMSLayer(layerName, geometryType) {
    return new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: `${geoserverUrl}/wms`,
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

// Inicialización de los controles de comparación
const compareButton = document.getElementById('compareLayers');
const comparisonControls = document.getElementById('comparisonControls');
const closeButton = document.getElementById('closeComparison');
const layer1Select = document.getElementById('layer1Select');
const layer2Select = document.getElementById('layer2Select');
const layer1Opacity = document.getElementById('layer1Opacity');
const layer2Opacity = document.getElementById('layer2Opacity');

// Llenar los selectores con las capas disponibles
Object.entries(layers).forEach(([id, layer]) => {
    const option1 = new Option(layer.name, id);
    const option2 = new Option(layer.name, id);
    layer1Select.add(option1);
    layer2Select.add(option2);
});

// Mostrar/ocultar controles de comparación
compareButton.addEventListener('click', () => {
    // Guardar el estado actual de las capas antes de entrar en modo comparación
    const layerStates = {};
    Object.entries(olLayers).forEach(([id, layer]) => {
        layerStates[id] = {
            visible: layer.getVisible(),
            opacity: layer.getOpacity()
        };
    });
    // Guardar el estado en el botón para usarlo al cerrar
    compareButton.dataset.layerStates = JSON.stringify(layerStates);
    
    comparisonControls.style.display = 'block';
});

closeButton.addEventListener('click', () => {
    comparisonControls.style.display = 'none';
    
    // Restaurar el estado original de las capas
    const layerStates = JSON.parse(compareButton.dataset.layerStates || '{}');
    Object.entries(olLayers).forEach(([id, layer]) => {
        const state = layerStates[id] || { visible: false, opacity: 1 };
        layer.setVisible(state.visible);
        layer.setOpacity(state.opacity);
    });
    
    // Limpiar los selectores
    layer1Select.value = '';
    layer2Select.value = '';
    layer1Opacity.value = 50;
    layer2Opacity.value = 50;
});

// Manejar cambios en la selección de capas
function updateLayerComparison() {
    const layer1Id = layer1Select.value;
    const layer2Id = layer2Select.value;

    // Ocultar todas las capas primero
    Object.values(olLayers).forEach(layer => {
        layer.setVisible(false);
    });

    // Mostrar y ajustar opacidad de las capas seleccionadas
    if (layer1Id) {
        const layer1 = olLayers[layer1Id];
        layer1.setVisible(true);
        layer1.setOpacity(layer1Opacity.value / 100);
    }

    if (layer2Id) {
        const layer2 = olLayers[layer2Id];
        layer2.setVisible(true);
        layer2.setOpacity(layer2Opacity.value / 100);
    }
}

// Agregar event listeners para los controles
layer1Select.addEventListener('change', updateLayerComparison);
layer2Select.addEventListener('change', updateLayerComparison);
layer1Opacity.addEventListener('input', updateLayerComparison);
layer2Opacity.addEventListener('input', updateLayerComparison);

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

// Inicialización de Cesium
const cesiumContainer = document.createElement('div');
cesiumContainer.id = 'cesiumContainer';
cesiumContainer.style.display = 'none';
cesiumContainer.style.width = '100%';
cesiumContainer.style.height = '100%';
document.getElementById('map').appendChild(cesiumContainer);

// Crear instancia del CesiumManager
const cesiumManager = new CesiumManager('cesiumContainer', geoserverUrl, workspace);

// Control 3D mejorado
document.getElementById('toggle3D').addEventListener('click', async function() {
    console.log('Botón 3D clickeado');
    const mapDiv = document.getElementById('map');
    const cesiumDiv = document.getElementById('cesiumContainer');
    
    if (cesiumDiv.style.display === 'none') {
        console.log('Cambiando a vista 3D...');
        // Inicializar Cesium si no está inicializado
        if (!cesiumManager.isInitialized) {
            console.log('Inicializando Cesium...');
            const initialized = await cesiumManager.initialize();
            if (!initialized) {
                console.error('Error al inicializar Cesium');
                return;
            }
            console.log('Cesium inicializado exitosamente');
        }

        // Ocultar OpenLayers y mostrar Cesium
        mapDiv.querySelector('.ol-viewport').style.display = 'none';
        cesiumDiv.style.display = 'block';
        
        // Sincronizar capas visibles con Cesium
        Object.entries(olLayers).forEach(([id, layer]) => {
            if (layer.getVisible()) {
                console.log('Agregando capa visible:', id);
                cesiumManager.addLayer(id, layers[id].name, layers[id].geometry);
            }
        });
    } else {
        console.log('Cambiando a vista 2D...');
        // Mostrar OpenLayers y ocultar Cesium
        mapDiv.querySelector('.ol-viewport').style.display = 'block';
        cesiumDiv.style.display = 'none';
    }
});

// Modificar el evento de cambio de capas para incluir Cesium
document.querySelectorAll('.form-check-input').forEach(checkbox => {
    checkbox.addEventListener('change', async function() {
        const layerId = this.id;
        const layer = olLayers[layerId];
        
        if (layer) {
            layer.setVisible(this.checked);
            
            // Sincronizar con Cesium si está activo
            if (document.getElementById('cesiumContainer').style.display !== 'none') {
                if (this.checked) {
                    await cesiumManager.addLayer(layerId, layers[layerId].name, layers[layerId].geometry);
                } else {
                    cesiumManager.removeLayer(layerId);
                }
            }
            
            reorderActiveLayers();
            
            // Manejar la leyenda
            const checkboxContainer = this.closest('.form-check');
            if (this.checked) {
                const layerTitle = this.nextElementSibling.textContent.trim();
                const legendContainer = createLegendContainer(layers[layerId].name, layerTitle);
                checkboxContainer.appendChild(legendContainer);
                
                const toggleButton = legendContainer.querySelector('.toggle-legend');
                const legendContent = legendContainer.querySelector('.legend-content');
                
                toggleButton.addEventListener('click', function() {
                    const isExpanded = legendContent.style.display !== 'none';
                    legendContent.style.display = isExpanded ? 'none' : 'block';
                    this.querySelector('i').className = isExpanded ? 
                        'fas fa-chevron-right' : 'fas fa-chevron-down';
                });
            } else {
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

// Animación de entrada para los elementos
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.layer-group');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Inicializar controles de comparación
    initializeComparisonControls();
});

// Funciones para la comparación de capas
function initializeComparisonControls() {
    const compareButton = document.getElementById('compareLayers');
    const comparisonControls = document.getElementById('comparisonControls');
    const closeButton = document.getElementById('closeComparison');
    const layer1Select = document.getElementById('layer1Select');
    const layer2Select = document.getElementById('layer2Select');
    const layer1Opacity = document.getElementById('layer1Opacity');
    const layer2Opacity = document.getElementById('layer2Opacity');

    // Llenar los selectores con las capas disponibles
    Object.entries(layers).forEach(([id, layer]) => {
        const option1 = new Option(layer.name, id);
        const option2 = new Option(layer.name, id);
        layer1Select.add(option1);
        layer2Select.add(option2);
    });

    // Mostrar/ocultar controles de comparación
    compareButton.addEventListener('click', () => {
        comparisonControls.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        comparisonControls.style.display = 'none';
        // Restaurar opacidad original de las capas
        Object.values(olLayers).forEach(layer => {
            layer.setOpacity(1);
        });
    });

    // Manejar cambios en la selección de capas
    function updateLayerComparison() {
        const layer1Id = layer1Select.value;
        const layer2Id = layer2Select.value;

        // Ocultar todas las capas primero
        Object.values(olLayers).forEach(layer => {
            layer.setVisible(false);
        });

        // Mostrar y ajustar opacidad de las capas seleccionadas
        if (layer1Id) {
            const layer1 = olLayers[layer1Id];
            layer1.setVisible(true);
            layer1.setOpacity(layer1Opacity.value / 100);
        }

        if (layer2Id) {
            const layer2 = olLayers[layer2Id];
            layer2.setVisible(true);
            layer2.setOpacity(layer2Opacity.value / 100);
        }
    }

    // Agregar event listeners para los controles
    layer1Select.addEventListener('change', updateLayerComparison);
    layer2Select.addEventListener('change', updateLayerComparison);
    layer1Opacity.addEventListener('input', updateLayerComparison);
    layer2Opacity.addEventListener('input', updateLayerComparison);
}

document.getElementById('toggleControls').addEventListener('click', function() {
    const menu = document.querySelector('.fab-menu');
    const mainButton = this;
    
    menu.classList.toggle('active');
    mainButton.classList.toggle('active');
}); 