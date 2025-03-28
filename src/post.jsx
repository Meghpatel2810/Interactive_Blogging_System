import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Post.css'; // Create and style this file as needed

const Post = () => {
  const { post_id } = useParams();
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [refresh, setRefresh] = useState(false);
  const token = localStorage.getItem('token');

  // Fetch post details
  const fetchPostDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${post_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [post_id, refresh]);

  // Handle Like action
  const handleLike = async () => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${post_id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Toggle refresh to refetch post details (like_count)
        setRefresh(prev => !prev);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle Comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/posts/${post_id}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment })
      });
      const data = await response.json();
      if (response.ok) {
        setNewComment('');
        setRefresh(prev => !prev);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  if (!post) return <div>Loading post...</div>;

  return (
    <div className="post-detail-container">
      {/* Post Header: Author & Categories */}
      <div className="post-header">
        <div className="post-author">
          <img 
            src={post.profile_photo 
                  ? `http://localhost:5000/photos/profile_photos/${post.profile_photo.split('\\').pop()}`
                  : '/default-avatar.png'} 
            alt="Author" 
            className="author-photo" 
          />
          <span className="author-name">{post.username}</span>
        </div>
        {post.categories && (
          <div className="post-categories">
            <strong>Categories:</strong>
            <div className="categories-container">
              {post.categories.split(',').map((cat, index) => (
                <span key={index} className="category-tag">{cat.trim()}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h2>{post.title}</h2>
        <p>{post.content}</p>
        <div className="post-meta">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Interactions: Like Button */}
      <div className="post-interactions">
        <button onClick={handleLike}>
          👍 Like ({post.like_count})
        </button>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h3>
          ✏️ Comments
        </h3>
        {post.comments && post.comments.length > 0 ? (
          post.comments.map(comment => (
            <div key={comment.comment_id} className="comment-card">
              <div className="comment-author">
                <img 
                  src={comment.profile_photo 
                        ? `http://localhost:5000/photos/profile_photos/${comment.profile_photo.split('\\').pop()}`
                        : '/default-avatar.png'} 
                  alt="Comment Author" 
                  className="comment-author-photo" 
                />
                <span className="comment-author-name">{comment.username}</span>
                <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="comment-text">{comment.content}</p>
            </div>
          ))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            required
          ></textarea>
          <button type="submit">
            ✏️ Submit Comment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Post;
