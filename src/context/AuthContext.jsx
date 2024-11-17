import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Default import for decoding JWT
import axios from "axios"; // For making API calls
import API_BASE_URL from "../config";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Store user details

  useEffect(() => {
    const token = localStorage.getItem("jwttoken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token); // Decode the JWT
        const userId = decodedToken.id; // Get user ID from the token
        const currentTime = Date.now() / 1000; // Current time in seconds
        if (decodedToken.exp < currentTime) {
          // Token expired
          logout();
        } else {
          setIsAuthenticated(true);
          fetchUser(userId); // Fetch user using the decoded ID
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        logout();
      }
    }
  }, []);

  const fetchUser = async (userId) => {
    try {
      const token = localStorage.getItem("jwttoken");
      if (!token) {
        throw new Error("No token found");
      }
  
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token in the header
        },
      });
  
      setUser({
        ...response.data,
        profileImage: response.data.profileImage || "/default-profile.png",
        height: response.data.height || "N/A",
        weight: response.data.weight || "N/A",
        gender: response.data.gender || "N/A",
        age: response.data.age || "N/A",
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null); // Optionally clear user data if request fails
    }
  };

  const login = async (token) => {
    try {
      localStorage.setItem("jwttoken", token);
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        // Token expired
        logout();
        throw new Error("Token has expired.");
      }
      await fetchUser(userId); // Fetch user using the decoded ID
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to log in:", error);
      logout(); // Log out if login fails
    }
  };

  const logout = () => {
    localStorage.removeItem("jwttoken");
    setUser(null); // Clear user data
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
