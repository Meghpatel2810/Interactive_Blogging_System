import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WritePost.css';

const WritePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const postData = {
      title,
      content,
      categories: selectedCategories,
    };

    try {
      const response = await fetch('http://localhost:5000/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error );
      }

      setMessage('Post created successfully!');
      setTimeout(() => navigate('/home'), 2000);
    } catch (error) {
      setMessage(error.message);
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="write-post-container">
      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Categories:</label>
          <div className="categories-container">
            {categories.map(category => (
              <button
                type="button"
                key={category.category_id}
                className={`category-btn ${
                  selectedCategories.includes(category.category_id) ? 'selected' : ''
                }`}
                onClick={() => handleCategoryToggle(category.category_id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">Publish Post</button>
      </form>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default WritePost;
