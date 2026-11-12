import { useEffect, useState } from "react";
import api from "../api.js";
import PostCard from "../components/PostCard.jsx";
import Loader from "../components/Loader.jsx";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/posts", {
          params: { page, search: query },
        });
        if (!alive) return;
        setPosts(data.posts);
        setPages(data.pages);
        setTotal(data.total);
      } catch (err) {
        if (alive) {
          setError(
            err.response?.data?.message ||
              "Failed to load posts. Is the backend running on port 5000?"
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, query]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const clearSearch = () => {
    setSearch("");
    setPage(1);
    setQuery("");
  };

  return (
    <>
      <section className="hero">
        <p className="eyebrow">A community for curious minds</p>
        <h1>Stories worth sharing.</h1>
        <p className="hero-description">
          Ideas, experiences, and little discoveries — told by people like you.
        </p>
        <form onSubmit={submitSearch} className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts or tags…"
            aria-label="Search posts"
          />
          <div className="search-actions">
            <button className="btn btn-gold" type="submit">
              Search
            </button>
            {(search || query) && (
              <button
                className="btn btn-outline"
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </form>
        <p className="search-hint">Find your next read by title or tag.</p>
      </section>

      {error && <p className="error-banner">{error}</p>}

      {!error && (
        <section className="feed-heading" aria-live="polite">
          <div>
            <p className="eyebrow">{query ? "Your search" : "The Inkwell feed"}</p>
            <h2>{query ? "Search results" : "Latest stories"}</h2>
          </div>
          {!loading && (
            <p className="feed-count">
              {total} {total === 1 ? "story" : "stories"}
              {query ? ` for “${query}”` : " to explore"}
            </p>
          )}
        </section>
      )}

      {loading ? (
        <Loader label="Fetching stories…" />
      ) : (
        <div className="grid">
          {posts.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <p className="empty">
          No posts found{query ? ` for “${query}”` : ""} yet. Be the first to
          write one!
        </p>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {page} of {pages} ({total} posts)
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
