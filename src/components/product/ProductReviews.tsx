import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, Plus } from 'lucide-react';
import { supabase, ProductReview, ReviewComment, formatPrice } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProductReviewsProps {
  productId: string;
  reviews: ProductReview[];
  onReviewsUpdate: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews,
  onReviewsUpdate,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    review_text: '',
  });
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to write a review');
        return;
      }

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: newReview.rating,
          title: newReview.title,
          review_text: newReview.review_text,
        });

      if (error) throw error;

      setNewReview({ rating: 5, title: '', review_text: '' });
      setShowReviewForm(false);
      onReviewsUpdate();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to like reviews');
        return;
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });
      }

      onReviewsUpdate();
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleAddComment = async (reviewId: string) => {
    const commentText = newComment[reviewId];
    if (!commentText?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to comment');
        return;
      }

      const { error } = await supabase
        .from('review_comments')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          comment_text: commentText,
        });

      if (error) throw error;

      setNewComment({ ...newComment, [reviewId]: '' });
      onReviewsUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (reviewId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedComments(newExpanded);
  };

  return (
    <section className="mb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
              <p className="text-gray-600 mt-1">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Rating Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">Based on {reviews.length} reviews</p>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            rating <= newReview.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Summarize your review"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review
                  </label>
                  <textarea
                    value={newReview.review_text}
                    onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Share your experience with this product"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {review.user_profile?.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {review.user_profile?.full_name || 'Anonymous User'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    )}
                    
                    {review.review_text && (
                      <p className="text-gray-700 mb-4">{review.review_text}</p>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeReview(review.id)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">Helpful ({review.helpful_count})</span>
                      </button>
                      
                      <button
                        onClick={() => toggleComments(review.id)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">Comments</span>
                      </button>
                    </div>
                    
                    {/* Comments Section */}
                    {expandedComments.has(review.id) && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <div className="space-y-3">
                          {/* Add Comment Form */}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newComment[review.id] || ''}
                              onChange={(e) => setNewComment({ ...newComment, [review.id]: e.target.value })}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                            <button
                              onClick={() => handleAddComment(review.id)}
                              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};