import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const firebaseConfig = {
  apiKey: "AIzaSyBW_Zdl6VYqGt1s8ZWldIHe3XQ8Iz_AxJc",
  authDomain: "loc-dashboard.firebaseapp.com",
  projectId: "loc-dashboard",
  storageBucket: "loc-dashboard.firebasestorage.app",
  messagingSenderId: "882615853798",
  appId: "1:882615853798:web:a7cc21f5ee5ea0aa2e1127",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CaptureApp = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && location.latitude !== 0 && location.longitude !== 0) {
      const map = L.map(mapContainerRef.current).setView([location.latitude, location.longitude], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      L.marker([location.latitude, location.longitude]).addTo(map).bindPopup("You are here").openPopup();
    }
  }, [location]);

  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col items-center">
      {!user ? (
        <div className="bg-white p-6 rounded shadow-md w-80">
          <h2 className="text-xl font-semibold text-center">Sign Up / Login</h2>
          <input type="email" placeholder="Email" className="border p-2 w-full mt-2" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="border p-2 w-full mt-2" onChange={(e) => setPassword(e.target.value)} />
          <div className="flex justify-between mt-4">
            <button onClick={signUp} className="bg-blue-500 text-white p-2 rounded">Sign Up</button>
            <button onClick={login} className="bg-green-500 text-white p-2 rounded">Login</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Map and Location</h2>
          <div ref={mapContainerRef} className="mt-4 h-64 w-full rounded shadow bg-gray-300"></div>
          <button onClick={logout} className="bg-red-500 text-white p-2 rounded w-full mt-4">Logout</button>
        </div>
      )}
    </div>
  );
};

export default CaptureApp;
