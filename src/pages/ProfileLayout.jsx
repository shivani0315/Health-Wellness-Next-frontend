import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle, FaWeightHanging, FaRulerCombined, FaTransgender, FaBirthdayCake, FaRegEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import './profileLayout.css';
import API_BASE_URL from "../config";


export default function ProfileLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false); 
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    height: "",
    weight: "",
    gender: "",
    age: "",
  });

  // This effect loads the user's profile data when the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in to view your profile");
      setLoading(false);
    } else {
      if (user) {
        setProfileData({
          username: user.username || "",
          email: user.email || "",
          height: user.height || "",
          weight: user.weight || "",
          gender: user.gender || "",
          age: user.age || "",
        });
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Handles changes in the input fields
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  }, []);

  // Handles form submission and sends updated profile data to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please log in first");
      return;
    }

    const { username, email, height, weight, gender, age } = profileData;

    // Validate fields before submitting
    if (!username || !email || !height || !weight || !gender || !age) {
      toast.error("All fields are required");
      return;
    }

    if (isNaN(height) || isNaN(weight) || isNaN(age)) {
      toast.error("Height, weight, and age must be numbers");
      return;
    }

    try {
      const userId = user.id; // Get the user ID from context
      const genderValue = gender.toLowerCase(); // Convert gender to lowercase

      const profileDataToUpdate = {
        userId,
        username,
        email,
        height: parseFloat(height),
        weight: parseFloat(weight),
        gender: genderValue, // Send the gender as lowercase
        age: parseInt(age),
      };

      // Retrieve the token from the user context or localStorage
      const token = user.token || localStorage.getItem("jwttoken");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,  
        profileDataToUpdate, 
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Include token in the header
          },
        }
      );
      console.log(token);
      toast.success(response.data.message);
      setEditing(false);
    } catch (error) { 
      console.log(error.message);
      console.error("Error updating profile:", error.response ? error.response.data : error.message);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return <div className="loading-text">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="error-message">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-image-container">
          <FaUserCircle className="profile-icon" />
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="edit-form">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={profileData.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="edit-input"
            />
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="edit-input"
            />
            <label htmlFor="height">Height (cm)</label>
            <input
              id="height"
              type="text"
              name="height"
              value={profileData.height}
              onChange={handleInputChange}
              placeholder="Height"
              className="edit-input"
            />
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              type="text"
              name="weight"
              value={profileData.weight}
              onChange={handleInputChange}
              placeholder="Weight"
              className="edit-input"
            />
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={profileData.gender}
              onChange={handleInputChange}
              className="edit-input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              name="age"
              value={profileData.age}
              onChange={handleInputChange}
              placeholder="Age"
              className="edit-input"
            />
            <button type="submit" className="submit-button">Save</button>
          </form>
        ) : (
          <div className="profile-info">
            <div className="profile-info-item">
              <FaUserCircle className="info-icon" />
              <span>{user.username}</span>
            </div>
            <div className="profile-info-item">
              <FaRegEnvelope className="info-icon" />
              <span>{user.email}</span>
            </div>
            <div className="profile-info-item">
              <FaRulerCombined className="info-icon" />
              <span>{user.height} cm</span>
            </div>
            <div className="profile-info-item">
              <FaWeightHanging className="info-icon" />
              <span>{user.weight} kg</span>
            </div>
            <div className="profile-info-item">
              <FaTransgender className="info-icon" />
              <span>{user.gender}</span>
            </div>
            <div className="profile-info-item">
              <FaBirthdayCake className="info-icon" />
              <span>{user.age} years</span>
            </div>
            <button onClick={() => setEditing(true)} className="edit-button">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
