import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error(error);
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {profileData && (
        <div className="profile-info">
            <img
              src={profileData.profilePhoto 
                ? `http://localhost:5000/photos/profile_photos/${profileData.profilePhoto.split('\\').pop()}`
                : '/default-avatar.png'}
              alt="Profile"
              className="profile-photo-large"
            />

          <div className="profile-details">
            <p><strong>Username:</strong> {profileData.username}</p>
            <p><strong>Email:</strong> {profileData.email}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;