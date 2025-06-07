// Global variables
let scene, camera, renderer, clock;
let planets = [];
let sun;
let stars = [];
let isPaused = false;
let isLightTheme = false;
let controls = null;
let raycaster, mouse;
let hoveredPlanet = null;

// Planet data with realistic properties
const planetData = [
    { name: 'Mercury', radius: 0.38, distance: 5, speed: 4.15, color: 0x8c7853, info: 'Closest planet to the Sun. No atmosphere.' },
    { name: 'Venus', radius: 0.95, distance: 7, speed: 1.62, color: 0xffc649, info: 'Hottest planet. Thick toxic atmosphere.' },
    { name: 'Earth', radius: 1, distance: 9, speed: 1, color: 0x6b93d6, info: 'Our home planet. Perfect for life.' },
    { name: 'Mars', radius: 0.53, distance: 11, speed: 0.53, color: 0xc1440e, info: 'The Red Planet. Has polar ice caps.' },
    { name: 'Jupiter', radius: 2.5, distance: 16, speed: 0.08, color: 0xf5deb3, info: 'Largest planet. Great Red Spot storm.' },
    { name: 'Saturn', radius: 2.1, distance: 22, speed: 0.03, color: 0xfad5a5, info: 'Beautiful ring system made of ice and rock.' },
    { name: 'Uranus', radius: 1.6, distance: 28, speed: 0.01, color: 0x4fd0e7, info: 'Ice giant tilted on its side.' },
    { name: 'Neptune', radius: 1.5, distance: 34, speed: 0.006, color: 0x4b70dd, info: 'Windiest planet with speeds up to 2,100 km/h.' }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Setup mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create simple orbit controls
    setupSimpleControls();
    
    // Create lighting
    createLighting();
    
    // Create sun
    createSun();
    
    // Create planets
    createPlanets();
    
    // Create background stars
    createStars();
    
    // Setup UI
    setupUI();
    
    // Setup event listeners
    setupEventListeners();
    
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
    
    // Start animation
    animate();
}

function setupSimpleControls() {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    renderer.domElement.addEventListener('mousedown', (event) => {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (mouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
        
        // Update mouse position for raycasting
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Smooth camera rotation
    function updateCamera() {
        rotationX += (targetRotationX - rotationX) * 0.1;
        rotationY += (targetRotationY - rotationY) * 0.1;
        
        const radius = 50;
        camera.position.x = Math.sin(rotationY) * Math.cos(rotationX) * radius;
        camera.position.y = Math.sin(rotationX) * radius;
        camera.position.z = Math.cos(rotationY) * Math.cos(rotationX) * radius;
        camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(updateCamera);
    }
    updateCamera();

    // Zoom
    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const direction = event.deltaY > 0 ? 1 : -1;
        const currentDistance = camera.position.length();
        const newDistance = Math.max(20, Math.min(100, currentDistance + direction * zoomSpeed * currentDistance));
        
        camera.position.multiplyScalar(newDistance / currentDistance);
    });
}

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);
    
    // Point light from sun
    const sunLight = new THREE.PointLight(0xffffff, 2, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xff6600,
        emissiveIntensity: 0.3
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
}

function createPlanets() {
    planetData.forEach((data, index) => {
        // Create planet geometry and material
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshLambertMaterial({ color: data.color });
        const planet = new THREE.Mesh(geometry, material);
        
        // Position planet
        planet.position.x = data.distance;
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        // Create orbit line
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = -Math.PI / 2;
        scene.add(orbit);
        
        // Store planet data
        planet.userData = {
            ...data,
            angle: Math.random() * Math.PI * 2,
            originalSpeed: data.speed,
            currentSpeed: data.speed,
            orbit: orbit
        };
        
        scene.add(planet);
        planets.push(planet);
    });
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

function setupUI() {
    const controlsContainer = document.getElementById('planet-controls');
    
    planetData.forEach((data, index) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'planet-control';
        controlDiv.innerHTML = `
            <div class="planet-name">
                <span class="planet-color" style="background-color: #${data.color.toString(16).padStart(6, '0')}"></span>
                ${data.name}
            </div>
            <input type="range" class="speed-slider" min="0" max="10" step="0.1" value="${data.speed}" 
                   data-planet="${index}" id="slider-${index}">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                <span>Slow</span>
                <span id="speed-${index}">${data.speed.toFixed(1)}x</span>
                <span>Fast</span>
            </div>
        `;
        controlsContainer.appendChild(controlDiv);
        
        // Add event listener
        const slider = controlDiv.querySelector('.speed-slider');
        slider.addEventListener('input', (e) => {
            const planetIndex = parseInt(e.target.dataset.planet);
            const speed = parseFloat(e.target.value);
            planets[planetIndex].userData.currentSpeed = speed;
            document.getElementById(`speed-${planetIndex}`).textContent = speed.toFixed(1) + 'x';
        });
    });
}

function setupEventListeners() {
    // Pause/Resume button
    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        const btn = document.getElementById('pauseBtn');
        btn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
    });
    
    // Theme toggle
    document.getElementById('themeBtn').addEventListener('click', () => {
        isLightTheme = !isLightTheme;
        document.body.classList.toggle('light-theme', isLightTheme);
        const btn = document.getElementById('themeBtn');
        btn.textContent = isLightTheme ? '☀️ Light' : '🌙 Dark';
        
        // Update background stars visibility
        scene.children.forEach(child => {
            if (child instanceof THREE.Points) {
                child.material.opacity = isLightTheme ? 0.3 : 1;
            }
        });
    });
    
    // Mouse move for tooltips
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onMouseMove(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Raycast to detect planet hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    
    const tooltip = document.getElementById('tooltip');
    const infoPanel = document.getElementById('planetInfo');
    
    if (intersects.length > 0) {
        const planet = intersects[0].object;
        const data = planet.userData;
        
        if (hoveredPlanet !== planet) {
            hoveredPlanet = planet;
            
            // Show tooltip
            tooltip.innerHTML = `<strong>${data.name}</strong><br>${data.info}`;
            tooltip.style.left = event.clientX + 10 + 'px';
            tooltip.style.top = event.clientY - 10 + 'px';
            tooltip.classList.add('show');
            
            // Update info panel
            infoPanel.innerHTML = `
                <strong>${data.name}</strong><br>
                <small>Distance: ${data.distance} AU<br>
                Radius: ${data.radius} Earth radii<br>
                Speed: ${data.currentSpeed.toFixed(2)}x Earth speed</small><br>
                ${data.info}
            `;
        }
    } else {
        if (hoveredPlanet) {
            hoveredPlanet = null;
            tooltip.classList.remove('show');
            infoPanel.innerHTML = 'Hover over a planet to see details';
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!isPaused) {
        const deltaTime = clock.getDelta();
        
        // Rotate sun
        if (sun) {
            sun.rotation.y += deltaTime * 0.5;
        }
        
        // Update planet positions and rotations
        planets.forEach((planet) => {
            const data = planet.userData;
            
            // Update orbit angle
            data.angle += deltaTime * data.currentSpeed * 0.1;
            
            // Update position
            planet.position.x = Math.cos(data.angle) * data.distance;
            planet.position.z = Math.sin(data.angle) * data.distance;
            
            // Rotate planet
            planet.rotation.y += deltaTime * 2;
        });
        
        // Animate stars
        scene.children.forEach(child => {
            if (child instanceof THREE.Points) {
                child.rotation.y += deltaTime * 0.05;
            }
        });
    }
    
    renderer.render(scene, camera);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);