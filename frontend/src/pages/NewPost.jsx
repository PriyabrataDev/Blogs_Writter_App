import { useNavigate } from "react-router-dom";
import PostForm from "../components/PostForm.jsx";
import api from "../api.js";

export default function NewPost() {
  const navigate = useNavigate();

  const submit = async (payload) => {
    const { data } = await api.post("/posts", payload);
    navigate(`/posts/${data._id}`);
  };

  return (
    <div className="page-narrow">
      <p className="eyebrow">Your voice belongs here</p>
      <h1>Write a new post</h1>
      <p className="form-intro">
        Give your story a clear title, then write it in your own words.
      </p>
      <PostForm onSubmit={submit} submitLabel="Publish" />
    </div>
  );
}
