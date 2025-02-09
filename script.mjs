/* Page Data */
const TouristDestinations = await fetch('india_tourism.json').then(response => response.json());
const StateData = await fetch('state_data.json').then(response => response.json());

/* DOM Elements */
const mapContainer = document.getElementById('map');
const TourismSelect = document.getElementById('tourism-type-dropdown');
const card = document.querySelector('.card');
const slider = document.querySelector('.slider');

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
  maxZoom: 10, // Maximum zoom level (same as minZoom to lock zoom)
  // zoomControl: false, // Disable zoom controls
  // dragging: false, // Disable panning
  // scrollWheelZoom: false, // Disable scroll wheel zoom
  doubleClickZoom: false, // Disable double-click zoom
  // touchZoom: false, // Disable touch zoom
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


/* Functions */
// Function to zoom and focus on a clicked state
function zoomAndFocus(stateBounds, stateName) {
  map.fitBounds(stateBounds, { padding: [0, 0], animate: true });
}

function showCardData(stateName) {
  const cardData = StateData[stateName];
  console.log('Card Data:', cardData);
  // Adding Images
  cardData.Images.forEach((img, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = img;
    imgElement.alt = `Slide ${index + 1}`;
    imgElement.className = index === 0 ? 'active' : '';
    slider.appendChild(imgElement);

  document.querySelector('.card-header').children[0].textContent = cardData.stateName;

  // Set title and description
  document.querySelector('.card-title').textContent = cardData.Title;
  document.querySelector('.card-description').textContent = cardData.Description;

  // Slider functionality
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slider img');

  function nextSlide() {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
  }

  setInterval(nextSlide, 5 * 1000); // Change slide every 5 second

  // Display the card
  card.style.display = 'block';
});
}

function renderMap() {
  // Load the GeoJSON data for India's states
  fetch('india_states.geojson') // Path to your GeoJSON file
  .then(response => response.json())
  .then(data => {
    // Add the GeoJSON layer to the map
    const geoJsonLayer = L.geoJSON(data, {
      style: function (feature) {
        // Assign a unique color to each state
        const stateIndex = feature.properties.NAME_1.charCodeAt(0) % colors.length;
        return {
          color: '#333', // Border color
          weight: 1, // Border width
          fillColor: colors[stateIndex], // Unique fill color
          fillOpacity: 0.2 // Fill opacity
        };
      },
      onEachFeature: function (feature, layer) {
        // Add a popup with the state name
        if (feature.properties && feature.properties.NAME_1) {
          layer.on('click', () => {
            zoomAndFocus(layer.getBounds(), feature.properties.NAME_1);
            const stateName = feature.properties.NAME_1;
            console.log('State Name:', stateName);
            if (stateName === 'Maharashtra' || stateName === 'Gujarat' || stateName === 'Uttaranchal') {
              showCardData(stateName);
            }
          });
          layer.on('mouseover', () => {
            if (map.getZoom() < 5) {
              layer.setStyle({fillOpacity: 0.8});
            }
            const center = layer.getBounds().getCenter();
            layer.bindTooltip(feature.properties.NAME_1, { permanent: false, direction: 'top' }).openTooltip(center);
          });

          layer.on('mouseout', () => {
            layer.setStyle({fillOpacity: 0.2});
          });
        }
      }

    }).addTo(map);


    // Add zoomend event listener to the map
    map.on('zoomend', () => {
      const zoomLevel = map.getZoom();
      geoJsonLayer.eachLayer(layer => {
        if (zoomLevel >= 8) { // Change 10 to your desired zoom level
          layer.setStyle({ fillColor: 'transparent', fillOpacity: 0 });
        } else {
          const stateIndex = layer.feature.properties.NAME_1.charCodeAt(0) % colors.length;
          layer.setStyle({ fillColor: colors[stateIndex], fillOpacity: 0.2 });
        }
      });
    })

  })
  .catch(error => console.error('Error loading GeoJSON:', error));
}

// Function to display destinations on the map
function showLocations(locations) {
  // Clear existing layers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  try {

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
  catch (err) {
    console.error('Error displaying locations:', err);
  }
}

/* Event Listeners */
TourismSelect.addEventListener('change',  (event) => {
  const tourismType = event.target.value;
  if (TouristDestinations[tourismType]) {
    showLocations(TouristDestinations[tourismType]);
  }
});

/* On Page Load */
renderMap();