import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const COMMENT_PAGE_SIZE = 20;

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestController = useRef(null);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadData = useCallback(async (signal) => {
    const [postResult, commentsResult] = await Promise.allSettled([
      api.get(`/posts/${id}`, { signal }),
      api.get(`/posts/${id}/comments`, {
        params: { page: 1, limit: COMMENT_PAGE_SIZE },
        signal,
      }),
    ]);

    if (signal.aborted) return;
    if (postResult.status === "rejected") {
      setError(
        postResult.reason.response?.data?.message || "Failed to load post"
      );
      return;
    }

    setPost(postResult.value.data);
    if (commentsResult.status === "rejected") {
      setCommentsError(
        commentsResult.reason.response?.data?.message ||
          "Failed to load comments"
      );
      return;
    }

    setComments(commentsResult.value.data.comments);
    setCommentPage(commentsResult.value.data.page);
    setCommentTotal(commentsResult.value.data.total);
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    requestController.current = controller;
    setPost(null);
    setComments([]);
    setCommentPage(1);
    setCommentTotal(0);
    setCommentText("");
    setError("");
    setActionError("");
    setCommentsError("");
    setLoadingMore(false);
    setSubmittingComment(false);
    setLiking(false);
    loadData(controller.signal);
    return () => {
      controller.abort();
      if (requestController.current === controller) {
        requestController.current = null;
      }
    };
  }, [loadData]);

  if (error) return <p className="empty">{error}</p>;
  if (!post) return <Loader />;

  const isAuthor =
    user && String(post.author?._id) === String(user._id);
  const liked =
    user && post.likes?.some((u) => String(u) === String(user._id));

  const toggleLike = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/posts/${id}` } });
      return;
    }
    setActionError("");
    setLiking(true);
    const signal = requestController.current?.signal;
    try {
      const { data } = await api.put(`/posts/${id}/like`, null, { signal });
      setPost((prev) => ({ ...prev, likes: data.likes }));
    } catch (err) {
      if (!signal?.aborted) {
        setActionError(err.response?.data?.message || "Failed to update like");
      }
    } finally {
      if (!signal?.aborted) setLiking(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionError("");
    setSubmittingComment(true);
    const signal = requestController.current?.signal;
    try {
      const { data } = await api.post(`/posts/${id}/comments`, {
        content: commentText.trim(),
      }, { signal });
      if (signal?.aborted) return;
      setComments((current) => [data, ...current]);
      const nextTotal = commentTotal + 1;
      setCommentTotal(nextTotal);
      setCommentText("");
    } catch (err) {
      if (!signal?.aborted) {
        setActionError(err.response?.data?.message || "Failed to add comment");
      }
    } finally {
      if (!signal?.aborted) setSubmittingComment(false);
    }
  };

  const loadMoreComments = async () => {
    if (loadingMore || comments.length >= commentTotal) return;
    setLoadingMore(true);
    setCommentsError("");
    const signal = requestController.current?.signal;
    try {
      const { data } = await api.get(`/posts/${id}/comments`, {
        params: { page: commentPage + 1, limit: COMMENT_PAGE_SIZE },
        signal,
      });
      if (signal?.aborted) return;
      setComments((current) => {
        const existingIds = new Set(current.map((comment) => comment._id));
        return [
          ...current,
          ...data.comments.filter((comment) => !existingIds.has(comment._id)),
        ];
      });
      setCommentPage(data.page);
      setCommentTotal(data.total);
    } catch (err) {
      if (!signal?.aborted) {
        setCommentsError(err.response?.data?.message || "Failed to load more comments");
      }
    } finally {
      if (!signal?.aborted) setLoadingMore(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    setActionError("");
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      setComments((cs) => cs.filter((c) => c._id !== commentId));
      setCommentTotal((total) => Math.max(total - 1, 0));
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post permanently?")) return;
    setActionError("");
    try {
      await api.delete(`/posts/${id}`);
      navigate("/");
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete post");
    }
  };

  const date = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="post-page">
      {post.coverImage && (
        <img className="post-cover" src={post.coverImage} alt="" />
      )}

      <h1 className="post-title">{post.title}</h1>

      <div className="post-meta">
        <span className="author">{post.author?.name}</span>
        <span className="dot-sep">•</span>
        <span>{date}</span>
      </div>

      {post.tags?.length > 0 && (
        <div className="tags">
          {post.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="post-content">
        {post.content.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="post-actions">
        <button
          className={`btn ${liked ? "btn-gold" : "btn-outline"}`}
          onClick={toggleLike}
          disabled={liking}
        >
          {liking ? "Updating…" : liked ? "♥ Liked" : "♡ Like"} ({post.likes?.length || 0})
        </button>

        {isAuthor && (
          <>
            <Link className="btn btn-outline" to={`/posts/${post._id}/edit`}>
              Edit
            </Link>
            <button className="btn btn-danger" onClick={deletePost}>
              Delete
            </button>
          </>
        )}
      </div>

      {actionError && <p className="error-banner" role="alert">{actionError}</p>}

      <section className="comments">
        <h2>Comments ({commentTotal})</h2>

        {user ? (
          <form className="form comment-form" onSubmit={addComment}>
            <textarea
              rows={3}
              maxLength={1000}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts…"
            />
            <button
              className="btn btn-gold"
              type="submit"
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? "Posting…" : "Comment"}
            </button>
          </form>
        ) : (
          <p className="small">
            <Link to="/login">Log in</Link> to join the discussion.
          </p>
        )}

        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c._id} className="comment">
              <div className="comment-head">
                <span className="comment-author">
                  {c.author?.name || "Unknown"}
                </span>
                <span className="small">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {user &&
                  (String(c.author?._id) === String(user._id) || isAuthor) && (
                    <button
                      className="link danger"
                      onClick={() => deleteComment(c._id)}
                    >
                      ✕
                    </button>
                  )}
              </div>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>
        {commentsError && <p className="error-banner" role="alert">{commentsError}</p>}
        {comments.length < commentTotal && (
          <button
            className="btn btn-outline"
            onClick={loadMoreComments}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more comments"}
          </button>
        )}
      </section>
    </article>
  );
}
