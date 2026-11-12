import { useState } from "react";

export default function PostForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [title, setTitle] = useState(initial.title || "");
  const [content, setContent] = useState(initial.content || "");
  const [coverImage, setCoverImage] = useState(initial.coverImage || "");
  const [tags, setTags] = useState(initial.tags ? initial.tags.join(", ") : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content,
        coverImage: coverImage.trim(),
        tags,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form form-panel" onSubmit={handleSubmit} noValidate>
      {error && <p className="form-error" role="alert">{error}</p>}

      <label className="field">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="An interesting headline…"
          maxLength={150}
        />
        <span className="field-hint">{title.length}/150 characters</span>
      </label>

      <label className="field">
        <span>
          Cover image URL <em>(optional)</em>
        </span>
        <input
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://images.example.com/photo.jpg"
          maxLength={2048}
        />
      </label>

      <label className="field">
        <span>
          Tags <em>(comma separated)</em>
        </span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="react, javascript, life"
        />
      </label>

      <label className="field">
        <span>Story</span>
        <textarea
          rows={12}
          maxLength={50000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell your story…"
        />
        <span className="field-hint">
          Tip: use a blank line to separate paragraphs.
        </span>
      </label>

      <button className="btn btn-gold" type="submit" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
