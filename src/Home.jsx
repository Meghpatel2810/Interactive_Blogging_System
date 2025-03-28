import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [feedPosts, setFeedPosts] = useState([]);

  useEffect(() => {
    const fetchFeed = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/feed', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Feed data:', data);
        setFeedPosts(data);
      } catch (error) {
        console.error('Error fetching feed posts:', error);
      }
    };
    fetchFeed();
  }, []);

  return (
    <div className="home-wrapper">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => navigate('/home')}>
        Thought Verse
        </div>
        <nav className="user-actions">
          <button className="write-btn" onClick={() => navigate('/write')}>Write</button>
          <button className="profile-btn" onClick={() => navigate('/profile')}>Profile</button>
          <button className="logout-btn" onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
          }}>Logout</button>
        </nav>
      </header>

      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <ul>
          <li>For You</li>
          <li>Following</li>
          <li>Featured</li>
          <li>History</li>
          <li>Language</li>
          <li>Sports</li>
        </ul>
      </nav>

      <div className="home-container">
        {/* Main Feed */}
        <main className="main-feed">
          {feedPosts.map(post => (
            <div key={post.post_id} className="blog-card">
              <div className="post-author-info">
              <div className="post-author-info">
                <img 
                  src={post.profile_photo 
                    ? `http://localhost:5000/photos/profile_photos/${post.profile_photo.split('\\').pop()}`
                    : '/default-avatar.png'} 
                  alt="Author" 
                  className="feed-profile-photo"
                />
                <span className="author-name">{post.username.replace(/^User/, '')}</span>
              </div>


              </div>
              <h2 
                className="post-title"
                onClick={() => navigate(`/posts/${post.post_id}`)}
                style={{ cursor: 'pointer' }}
              >
                {post.title}
              </h2>
              <div className="interaction-count">
                <span>👍 {post.like_count} Likes</span>
                <span>💬 {post.comment_count} Comments</span>
              </div>
            </div>
          ))}
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <h3 className="sidebar-title">Staff Picks</h3>
          <div className="sidebar-item">
            <h4>June Zhu</h4>
            <p>The Looking Glass: Our Souls Need Proof</p>
          </div>
          <div className="sidebar-item">
            <h4>Jake HD</h4>
            <p>You Don't Need a Story, But You're Going to Jail: My Decision Criteria as a Canadian Citizen</p>
          </div>
          <div className="sidebar-item">
            <h4>Brian R</h4>
            <p>What They Can Tell Us About Tariffs</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
