import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'

const Home = () => {
    const navigate = useNavigate();

    return (
        <>
            <header className="header">
                <h1>Megh</h1>
                <div className="profile-section">
                    <button className="profile-btn" onClick={() => navigate('/profile')}>
                    <span>Profile</span>
                    </button>
                    <button className="logout-btn" onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/');
                    }}>Logout</button>
                </div>
            </header>

            <div className="home-container">
                {/* Left Sidebar */}
                <div className="sidebar">
                    <div className="section-title">For you</div>
                    <button className="trending-tag">Following</button>
                    <button className="trending-tag">Java</button>
                    
                    <div className="section-title" style={{marginTop: '2rem'}}>Search</div>
                    <button className="trending-tag">Medium</button>
                    <button className="trending-tag">Language</button>
                </div>

                {/* Main Content */}
                <main className="main-content">
                    <div className="blog-card">
                        <h2>How to Use ChatGPT in Daily Life?</h2>
                        <div className="blog-meta">
                            In Level Up Coding by Tirendaz AI · Apr 4, 2023
                        </div>
                        <div className="interaction-count">
                            <span>10.9K views</span>
                            <span>283 comments</span>
                        </div>
                    </div>

                    <div className="blog-card">
                        <h2>The Future of Front-End Development: Trends to Watch in 2025</h2>
                        <div className="blog-meta">
                            Future-proof your dev skills · Nov 30, 2024
                        </div>
                        <div className="interaction-count">
                            <span>569 views</span>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <div className="sidebar">
                    <button className="write-btn">Write</button>
                    <div className="section-title">Recommended Topics</div>
                    <button className="trending-tag">Food</button>
                    <button className="trending-tag">Programming</button>
                    <button className="trending-tag">Career</button>
                </div>
            </div>
        </>
    );
};

export default Home;