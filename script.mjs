
/* Page Data */
const TouristDestinations = await fetch('india_tourism.json').then(response => response.json());

// Define India's geographical bounds
const indiaBounds = L.latLngBounds(
  L.latLng(6.4627, 68.1097), // Southwest coordinates (bottom-left)
  L.latLng(35.5136, 97.3954) // Northeast coordinates (top-right)
);

// Initialize the map with bounds and maxBounds
const map = L.map('map', {
  maxBounds: indiaBounds, // Restrict panning outside India
  maxBoundsViscosity: 1.0, // Strictly enforce bounds
  minZoom: 4.6, // Minimum zoom level
  maxZoom: 4.6, // Maximum zoom level (same as minZoom to lock zoom)
  zoomControl: false, // Disable zoom controls
  dragging: false, // Disable panning
  scrollWheelZoom: false, // Disable scroll wheel zoom
  doubleClickZoom: false, // Disable double-click zoom
  touchZoom: false, // Disable touch zoom
  boxZoom: false // Disable box zoom
}).setView([20.5937, 78.9629], 4); // Centered on India

// Add a base tile layer (e.g., OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Array of 26 unique colors
const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5',
  '#F5FF33', '#FF3333', '#33FF33', '#3333FF', '#FF33FF',
  '#33FFFF', '#FFFF33', '#FF6633', '#33FF66', '#3366FF',
  '#FF33CC', '#33FFCC', '#FFCC33', '#CC33FF', '#33CCFF',
  '#FF9966', '#66FF99', '#6699FF', '#FF66CC', '#66FFCC',
  '#CCFF66'
];

// Load the GeoJSON data for India's states
fetch('india_states.geojson') // Path to your GeoJSON file
  .then(response => response.json())
  .then(data => {
    // Add the GeoJSON layer to the map
    L.geoJSON(data, {
      style: function (feature) {
        // Assign a unique color to each state
        const stateIndex = feature.properties.NAME_1.charCodeAt(0) % colors.length;
        return {
          color: '#333', // Border color
          weight: 1, // Border width
          fillColor: colors[stateIndex], // Unique fill color
          fillOpacity: 0.6 // Fill opacity
        };
      },
      onEachFeature: function (feature, layer) {
        // Add a popup with the state name
        if (feature.properties && feature.properties.NAME_1) {
          layer.bindPopup(feature.properties.NAME_1);
        }
      }
    }).addTo(map);
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

/* Functions */
// Function to display destinations on the map
function showLocations(locations) {
  // Clear existing layers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Add markers for each location
  locations.forEach(location => {
    const marker = L.marker([location.latitude, location.longitude], {
      icon: L.icon({
        iconUrl: './Assets/marker.png', // Path to your custom marker icon
        iconSize: [25, 30], // Initial size of the icon
        iconAnchor: [12, 30], // Anchor point of the icon
        popupAnchor: [1, -34] // Popup anchor point
      })
    }).bindPopup(location.name).addTo(map);

    // Adjust marker size based on zoom level
    map.on('zoomend', () => {
      const currentZoom = map.getZoom();
      const newSize = 25 + (currentZoom - 4) * 2; // Adjust size formula as needed
      marker.setIcon(L.icon({
        iconUrl: './Assets/marker.png',
        iconSize: [newSize, newSize * 1.64], // Adjust size proportionally
        iconAnchor: [newSize / 2, newSize * 1.64],
        popupAnchor: [1, -newSize * 1.64]
      }));
    });
  });
}

/* Eveent Listeners */

// Add event listeners to tourism type options
document.querySelector('#tourism-type-dropdown').addEventListener('change', event => {
  const tourismType = event.target.value;
  if (TouristDestinations[tourismType]) {
    showLocations(TouristDestinations[tourismType]);
  }
});
