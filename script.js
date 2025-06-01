let map;
let markers = [];
let infoWindow;
let allPlaces = [];
let directionsService;
let directionsRenderer;
let userLocation = null;
let selectedPlaceLatLng = null;

const tagTranslations = {
  library: "Бібліотека",
  art_gallery: "Художня галерея",
  tourist_attraction: "Туристична атракція",
  synagogue: "Синагога",
  hindu_temple: "Індуїстський храм",
  mosque: "Мечеть",
  zoo: "Зоопарк",
  stadium: "Стадіон",
  university: "Університет",
  aquarium: "Океанаріум",
  movie_theater: "Кінотеатр",
  amusement_park: "Парк розваг",
  night_club: "Нічний клуб",
  restaurant: "Ресторан",
  shopping_mall: "Торговий центр",
  spa: "Спа",
  campground: "Кемпінг",
  lodging: "Житло / Готель",
  casino: "Казино",
  bowling_alley: "Боулінг",
  gym: "Спортзал",
  bakery: "Пекарня",
  book_store: "Книжковий магазин",
  clothing_store: "Магазин одягу",
  electronics_store: "Магазин електроніки",
  department_store: "Універмаг",
  concert_hall: "Концертний зал",
  theater: "Театр",
  music_school: "Музична школа",
  cultural_center: "Культурний центр",
  observatory: "Астрономічна обсерваторія",
  festival_ground: "Майданчик для фестивалів",
  research_center: "Науково-дослідний центр",
  childrens_museum: "Дитячий музей",
  historical_site: "Історичне місце",
  environmental_center: "Екологічний центр",
  palace: "Палац",
  castle: "Замок",
  art_space: "Арт-простір",
  cinema_museum: "Музей кіно",
  folklore_museum: "Фольклорний музей",
  tourist_info_center: "Туристичний інформаційний центр",
  exhibition_hall: "Виставковий зал"
};

function getPlaceType() {
  return document.getElementById("place-type").value;
}

function initMap() {
  const center = { lat: 48.2920, lng: 25.9353 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: center,
    zoom: 13,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    polylineOptions: {
      strokeColor: "#E4C9B0",
      strokeWeight: 6,
    },
  });
  directionsRenderer.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "Ваше місце розташування",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    });
  }
}

document.getElementById("search-button").addEventListener("click", () => {
  const placeType = getPlaceType();
  searchPlaces(placeType);
});

document.getElementById("route-button").addEventListener("click", () => {
  if (selectedPlaceLatLng) {
    calculateRoutes(selectedPlaceLatLng.lat(), selectedPlaceLatLng.lng());
  }
});

function searchPlaces(type) {
  if (!map) return;

  const request = {
    location: map.getCenter(),
    radius: 3000,
    type: type,
  };

  const service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      clearMarkers();
      allPlaces = [];

      let loadedCount = 0;

      results.forEach((place) => {
        const detailsService = new google.maps.places.PlacesService(map);
        detailsService.getDetails({ placeId: place.place_id }, (details, status) => {
          loadedCount++;
          if (status === google.maps.places.PlacesServiceStatus.OK && details) {
            place.types = details.types || [];
            place.name = details.name;
            place.formatted_address = details.formatted_address;
            place.rating = details.rating;
            place.website = details.website;
            place.photos = details.photos;

            allPlaces.push(place);
            const marker = createMarker(place);
            marker.place = place;
            markers.push(marker);
          }

          // Викликати тільки коли завантажили всі
          if (loadedCount === results.length) {
            updateCheckboxFilters();
          }
        });
      });
    }
  });
}

function createMarker(place) {
  const marker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name,
  });

  const content = `
    <div style="max-width: 250px;">
      <h2>${place.name}</h2>
      <p><strong>Адреса:</strong> ${place.formatted_address || "Невідомо"}</p>
      <p><strong>Рейтинг:</strong> ${place.rating || "Немає"}</p>
      ${
        place.photos
          ? `<img src="${place.photos[0].getUrl({ maxWidth: 200 })}" style="width: 100%; border-radius: 8px; margin-top: 10px;">`
          : ""
      }
      ${place.website ? `<p><a href="${place.website}" target="_blank">${place.website}</a></p>` : ""}
    </div>
  `;

  marker.addListener("click", () => {
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
    selectedPlaceLatLng = place.geometry.location;
    document.getElementById("route-info").classList.remove("hidden");
    document.getElementById("travel-times").innerHTML = "";
    document.getElementById("route-button").disabled = false;
  });

  return marker;
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  allPlaces = [];
  selectedPlaceLatLng = null;
  document.getElementById("filters-container").innerHTML = "";
  document.getElementById("travel-times").innerHTML = "";
  document.getElementById("route-button").disabled = false;
  document.getElementById("route-info").classList.add("hidden");
}

function getActiveTags() {
  return Array.from(
    document.querySelectorAll("#filters-container input[type='checkbox']:checked")
  ).map((cb) => cb.value);
}

function filterPlacesByTags(tags) {
  markers.forEach((marker) => {
    const types = marker.place?.types || [];
    const visible = tags.length === 0 || tags.every((tag) => types.includes(tag));
    marker.setMap(visible ? map : null);
  });
}

function updateCheckboxFilters() {
  const container = document.getElementById("filters-container");
  container.innerHTML = "";

  const selectedType = document.getElementById("place-type").value;
  const selectedTypesSet = new Set([selectedType]);
  const tagSet = new Set();

  allPlaces.forEach((place) => {
    (place.types || []).forEach((tag) => {
      if (!selectedTypesSet.has(tag) && tagTranslations[tag]) {
        tagSet.add(tag);
      }
    });
  });

  [...tagSet].forEach((tag) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${tag}" />
      ${tagTranslations[tag]}
    `;
    container.appendChild(label);
  });

  container.addEventListener("change", filterMarkers);
}

function filterMarkers() {
  const selectedTags = getActiveTags();
  filterPlacesByTags(selectedTags);
}

function calculateRoutes(lat, lng) {
  if (!userLocation) return alert("Неможливо визначити ваше місцезнаходження");

  const selectedMode = document.querySelector('input[name="transport"]:checked').value;

  let travelMode = google.maps.TravelMode.DRIVING;
  let polylineOptions = {
    strokeColor: "#003559",
    strokeWeight: 6,
    strokeOpacity: 1,
  };

  if (selectedMode === "WALKING") {
    travelMode = google.maps.TravelMode.WALKING;
    polylineOptions = {
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 3,
            strokeColor: "#003559",
            strokeWeight: 2,
          },
          offset: "0",
          repeat: "12px",
        },
      ],
    };
  }

  if (directionsRenderer) directionsRenderer.setMap(null);

  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: polylineOptions,
  });

  const routeRequest = {
    origin: userLocation,
    destination: { lat, lng },
    travelMode: travelMode,
  };

  directionsService.route(routeRequest, (response, status) => {
    const travelTimesDiv = document.getElementById("travel-times");
    const routeInfoDiv = document.getElementById("route-info");

    if (status === "OK" && response.routes.length > 0) {
      directionsRenderer.setDirections(response);
      const duration = response.routes[0].legs[0].duration.text;
      const modeName = travelMode === google.maps.TravelMode.DRIVING ? "Авто" : "Пішки";
      travelTimesDiv.innerHTML = `<p>${modeName}: ${duration}</p>`;
      routeInfoDiv.classList.remove("hidden");
    } else {
      travelTimesDiv.innerHTML = "<p>Маршрут недоступний</p>";
    }
  });
}
