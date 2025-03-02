import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
    
      try {
        // Fetch profile data
        const response = await fetch('http://localhost:5000/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfileData(data);
    
        // Fetch categories WITH authorization header
        const categoriesResponse = await fetch(
          `http://localhost:5000/user/${data.userId}/categories`,
          {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          }
        );
        
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
    
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
            
            {categories.length > 0 && (
              <div className="profile-interests">
                <h3>Interests</h3>
                <div className="categories-container">
                  {categories.map(category => (
                    <span key={category.category_id} className="category-tag">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;