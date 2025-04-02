// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBW_Zdl6VYqGt1s8ZWldIHe3XQ8Iz_AxJc",
    authDomain: "loc-dashboard.firebaseapp.com",
    projectId: "loc-dashboard",
    storageBucket: "loc-dashboard.firebasestorage.app",
    messagingSenderId: "882615853798",
    appId: "1:882615853798:web:a7cc21f5ee5ea0aa2e1127"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Elements
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const uploadStatus = document.getElementById("uploadStatus");
const captureBtn = document.getElementById("capture-btn");
const uploadBtn = document.getElementById("upload-btn");
const captureInfo = document.getElementById("capture-info");
const imageContainer = document.getElementById("imageContainer");
const video = document.createElement("video");
const canvas = document.createElement("canvas");
document.body.appendChild(video);
video.style.display = "none";

window.onload = async function () {
  console.log("st")
  authContainer.classList.remove("hidden");
  appContainer.classList.add("hidden");
  await signOut(auth);
};


let stream = null;
let capturedData = {}; // Store captured image & data
let map ;

// 🔹 Initialize Map
document.addEventListener("DOMContentLoaded", function () {
  const appContainer = document.getElementById("app-container");

  // Initialize the map
  map= L.map("map").setView([0, 0], 2);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Show map correctly when the app container becomes visible
  if (appContainer) {
    appContainer.classList.remove("hidden"); 
    setTimeout(() => {
      map.invalidateSize(); // Force Leaflet to recalculate map size
    }, 100); // Slight delay ensures correct rendering
  }

  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        map.setView([lat, lon], 13);

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();

        map.invalidateSize(); // Ensure correct map rendering
      },
      function (error) {
        console.error("Error getting location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
});


async function displayUploadedImages() {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to view your uploads!");
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "captures"));
    imageContainer.innerHTML = ""; // Clear previous images

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === user.uid) { // Show only current user's images
        const card = document.createElement("div");
        card.className = "bg-white shadow-lg rounded-lg p-3 transition hover:scale-105 w-40";

        const imageElement = document.createElement("div");
        imageElement.className = "w-36 h-36 bg-cover bg-center rounded-md";
        imageElement.style.backgroundImage = `url(${data.imageBase64})`;

        const infoElement = document.createElement("div");
        infoElement.className = "text-sm text-gray-700 mt-2 text-center";
        infoElement.innerHTML = `
          <p class="font-semibold">📍 ${data.location.latitude.toFixed(5)}, ${data.location.longitude.toFixed(5)}</p>
          <p class="text-gray-500">${new Date(data.dateTime).toLocaleString()}</p>
        `;
        addMapMarker(data.location.latitude, data.location.longitude); // Add marker for each image

        card.appendChild(imageElement);
        card.appendChild(infoElement);
        imageContainer.appendChild(card);
      }
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    alert("Failed to load images: " + error.message);
  }
}


// 🔹 Start Webcam Stream (Only When Clicking Capture)
async function startWebcam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  } catch (error) {
    alert("Error accessing webcam: " + error.message);
  }
}

// 🔹 Stop Webcam Stream
function stopWebcam() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// 🔹 Capture Image from Webcam
captureBtn.addEventListener("click", async () => {
  await startWebcam();
  setTimeout(() => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/png");

    // Get Current Date, Time, and Location
    capturedData = {
      dateTime: new Date().toISOString(),
      location: { latitude: 0, longitude: 0 },
      imageBase64: base64Image
    };

    // Display Captured Image
    imageContainer.innerHTML = `<img src="${base64Image}" style="width:200px; border:2px solid black;">`;

    // Stop Webcam After Capture
    stopWebcam();

    // Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        capturedData.location.latitude = position.coords.latitude;
        capturedData.location.longitude = position.coords.longitude;
        captureInfo.innerHTML = `<p><strong>Captured at:</strong> ${capturedData.dateTime}</p>
                                 <p><strong>Location:</strong> Lat ${capturedData.location.latitude}, Lng ${capturedData.location.longitude}</p>`;
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, 500);
});

// 🔹 Upload Captured Image and Location to Firestore
uploadBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to upload!");
    return;
  }

  try {
    await addDoc(collection(db, "captures"), {
      userId: user.uid,
      imageBase64: capturedData.imageBase64,
      dateTime: capturedData.dateTime,
      location: capturedData.location,
      createdAt: serverTimestamp()
    });

    uploadStatus.textContent = "Upload successful!";
    addMapMarker(capturedData.location.latitude, capturedData.location.longitude);
  } catch (error) {
    uploadStatus.textContent = "Upload failed: " + error.message;
  }
});

// 🔹 Add Marker on Map and Zoom
function addMapMarker(lat, lon) {
  map.setView([lat, lon], 13);

  L.marker([lat, lon])
    .addTo(map)
    .bindPopup("Captured here!")
    .openPopup();

  map.invalidateSize();
}

// 🔹 User Authentication
signupBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Signup successful!");
  } catch (error) {
    alert(error.message);
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    displayUploadedImages();
    map.invalidateSize(); 
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  authContainer.classList.remove("hidden");
  appContainer.classList.add("hidden");

});