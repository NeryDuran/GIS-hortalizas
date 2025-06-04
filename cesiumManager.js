// Configuración del token de Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWZmOWY4MC1jYjNjLTQ3YTQtYWQyOC02M2M5MWYzOTgzNWMiLCJpZCI6MzAzNDEzLCJpYXQiOjE3NDc1MzA1Njl9.FMIpniAQuvcsY6ZpK6CukALZ3BrXGDhclM9spNsY2tY';

class CesiumManager {
    constructor(containerId, geoserverUrl, workspace) {
        console.log('Inicializando CesiumManager con:', { containerId, geoserverUrl, workspace });
        this.containerId = containerId;
        this.geoserverUrl = geoserverUrl;
        this.workspace = workspace;
        this.viewer = null;
        this.layers = {};
        this.isInitialized = false;

        // Asegurarse de que el contenedor exista y tenga las dimensiones correctas
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '1000';
        }
    }

    async initialize() {
        console.log('Iniciando inicialización de Cesium...');
        try {
            // Crear el terreno mundial
            console.log('Creando terreno mundial...');
            const terrainProvider = await Cesium.createWorldTerrainAsync();

            // Crear el viewer con la configuración completa
            console.log('Creando viewer de Cesium...');
            this.viewer = new Cesium.Viewer(this.containerId, {
                terrainProvider: terrainProvider,
                animation: false,       // Oculta el widget de animación
                timeline: false,        // Oculta la línea de tiempo
                homeButton: true,       // Muestra el botón de vista inicial
                sceneModePicker: true,  // Permite cambiar entre 3D, 2.5D y 2D
                baseLayerPicker: true,  // Permite seleccionar diferentes imágenes base
                geocoder: false,        // Oculta el buscador de geocodificación
                navigationHelpButton: false, // Oculta el botón de ayuda de navegación
                infoBox: true,          // Habilita el cuadro de información para GetFeatureInfo
                selectionIndicator: false,
                scene3DOnly: true,
                shadows: true,
                shouldAnimate: true
            });

            // Configurar controles de zoom
            this.setupZoomControls();

            // Centrar la vista en El Salvador
            console.log('Centrando vista en El Salvador...');
            await this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(-88.914068, 13.794185, 50000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0.0
                },
                duration: 2
            });

            // Configurar límites de zoom
            this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
            this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;

            this.isInitialized = true;
            console.log('Inicialización de Cesium completada exitosamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar Cesium:', error);
            return false;
        }
    }

    setupZoomControls() {
        // Crear contenedor para los controles de zoom
        const zoomContainer = document.createElement('div');
        zoomContainer.className = 'cesium-zoom-controls';
        zoomContainer.style.position = 'absolute';
        zoomContainer.style.left = '20px';
        zoomContainer.style.top = '50%';
        zoomContainer.style.transform = 'translateY(-50%)';
        zoomContainer.style.zIndex = '1001';
        zoomContainer.style.display = 'flex';
        zoomContainer.style.flexDirection = 'column';
        zoomContainer.style.gap = '10px';

        // Crear botón de zoom in
        const zoomInButton = document.createElement('button');
        zoomInButton.innerHTML = '<i class="fas fa-plus"></i>';
        zoomInButton.className = 'control-button';
        zoomInButton.style.width = '40px';
        zoomInButton.style.height = '40px';
        zoomInButton.style.borderRadius = '50%';
        zoomInButton.style.padding = '0';
        zoomInButton.style.display = 'flex';
        zoomInButton.style.alignItems = 'center';
        zoomInButton.style.justifyContent = 'center';
        zoomInButton.onclick = () => {
            const camera = this.viewer.camera;
            const currentHeight = camera.positionCartographic.height;
            const newHeight = currentHeight * 0.5;
            
            // Obtener la orientación actual de la cámara
            const heading = camera.heading;
            const pitch = camera.pitch;
            const roll = camera.roll;
            
            camera.flyTo({
                destination: Cesium.Cartesian3.fromRadians(
                    camera.positionCartographic.longitude,
                    camera.positionCartographic.latitude,
                    newHeight
                ),
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: roll
                },
                duration: 0.5
            });
        };

        // Crear botón de zoom out
        const zoomOutButton = document.createElement('button');
        zoomOutButton.innerHTML = '<i class="fas fa-minus"></i>';
        zoomOutButton.className = 'control-button';
        zoomOutButton.style.width = '40px';
        zoomOutButton.style.height = '40px';
        zoomOutButton.style.borderRadius = '50%';
        zoomOutButton.style.padding = '0';
        zoomOutButton.style.display = 'flex';
        zoomOutButton.style.alignItems = 'center';
        zoomOutButton.style.justifyContent = 'center';
        zoomOutButton.onclick = () => {
            const camera = this.viewer.camera;
            const currentHeight = camera.positionCartographic.height;
            const newHeight = currentHeight * 2;
            
            // Obtener la orientación actual de la cámara
            const heading = camera.heading;
            const pitch = camera.pitch;
            const roll = camera.roll;
            
            camera.flyTo({
                destination: Cesium.Cartesian3.fromRadians(
                    camera.positionCartographic.longitude,
                    camera.positionCartographic.latitude,
                    newHeight
                ),
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: roll
                },
                duration: 0.5
            });
        };

        // Agregar botones al contenedor
        zoomContainer.appendChild(zoomInButton);
        zoomContainer.appendChild(zoomOutButton);

        // Agregar el contenedor al DOM
        document.getElementById(this.containerId).appendChild(zoomContainer);
    }

    createWMSLayer(layerName, geometryType) {
        console.log('Creando capa WMS:', { layerName, geometryType });
        if (!this.viewer) {
            console.error('Error: Cesium viewer no está inicializado');
            return null;
        }


        const style = `${this.workspace}:${layerName}`;

        console.log('Configurando proveedor de imágenes WMS...');
        const imageryProvider = new Cesium.WebMapServiceImageryProvider({
            url: `${this.geoserverUrl}/wms`,
            layers: `${this.workspace}:${layerName}`,
            parameters: {
                format: 'image/png',
                transparent: true,
                styles: style,
                VERSION: '1.1.1',
                TILED: true,
                SRS: 'EPSG:4326'
            },
            enablePickFeatures: true, // Habilita GetFeatureInfo
            credit: new Cesium.Credit(layerName)
        });

        console.log('Agregando capa al viewer...');
        const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
        layer.alpha = 0.8;
        layer.brightness = 1.0;
        layer.show = true; // Asegurar que la capa sea visible

        // Forzar un renderizado
        this.viewer.scene.requestRender();

        console.log('Capa WMS creada exitosamente');
        return layer;
    }

    async addLayer(layerId, layerName, geometryType) {
        console.log('Agregando capa:', { layerId, layerName, geometryType });
        try {
            // Esperar a que Cesium esté inicializado
            if (!this.isInitialized) {
                console.log('Esperando a que Cesium se inicialice...');
                await this.initialize();
            }

            if (!this.layers[layerId]) {
                console.log('Creando nueva capa...');
                this.layers[layerId] = this.createWMSLayer(layerName, geometryType);
            }
            if (this.layers[layerId]) {
                console.log('Mostrando capa...');
                this.layers[layerId].show = true;
                // Forzar un renderizado
                this.viewer.scene.requestRender();
                console.log('Capa mostrada exitosamente');
            } else {
                console.warn('No se pudo crear la capa:', layerId);
            }
        } catch (error) {
            console.error('Error al agregar capa:', error);
        }
    }

    removeLayer(layerId) {
        console.log('Removiendo capa:', layerId);
        try {
            if (this.layers[layerId]) {
                this.layers[layerId].show = false;
                // Forzar un renderizado
                this.viewer.scene.requestRender();
                console.log('Capa removida exitosamente');
            } else {
                console.warn('Capa no encontrada:', layerId);
            }
        } catch (error) {
            console.error('Error al remover capa:', error);
        }
    }

    // Método para actualizar la opacidad de una capa
    setLayerOpacity(layerId, opacity) {
        if (this.layers[layerId]) {
            this.layers[layerId].alpha = opacity;
            this.viewer.scene.requestRender();
        }
    }

    // Método para actualizar el brillo de una capa
    setLayerBrightness(layerId, brightness) {
        if (this.layers[layerId]) {
            this.layers[layerId].brightness = brightness;
            this.viewer.scene.requestRender();
        }
    }

    show() {
        console.log('Mostrando contenedor de Cesium...');
        if (this.viewer) {
            const container = document.getElementById(this.containerId);
            if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                this.viewer.scene.requestRender();
                console.log('Contenedor mostrado y escena renderizada');
            } else {
                console.error('Error: Contenedor no encontrado');
            }
        } else {
            console.error('Error: Viewer no está inicializado');
        }
    }

    hide() {
        console.log('Ocultando contenedor de Cesium...');
        if (this.viewer) {
            const container = document.getElementById(this.containerId);
            if (container) {
                container.style.display = 'none';
                container.style.visibility = 'hidden';
                container.style.opacity = '0';
                console.log('Contenedor ocultado exitosamente');
            } else {
                console.error('Error: Contenedor no encontrado');
            }
        } else {
            console.error('Error: Viewer no está inicializado');
        }
    }

    updateView() {
        console.log('Actualizando vista...');
        if (this.viewer) {
            this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(-88.914068, 13.794185, 20000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-30),
                    roll: 0.0
                },
                duration: 2
            });
            console.log('Vista actualizada exitosamente');
        } else {
            console.error('Error: Viewer no está inicializado');
        }
    }
}

// Exportar la clase
window.CesiumManager = CesiumManager; 
