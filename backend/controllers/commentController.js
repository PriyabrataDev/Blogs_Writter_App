import asyncHandler from "../middleware/asyncHandler.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

const parsePage = (value, name, fallback, maximum) => {
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    const error = new Error(`${name} must be between 1 and ${maximum}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

// @desc    List comments for a post (newest first)
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
  const postExists = await Post.exists({ _id: req.params.postId });
  if (!postExists) {
    res.status(404);
    throw new Error("Post not found");
  }

  const page = parsePage(req.query.page, "page", 1, 1000000);
  const limit = parsePage(req.query.limit, "limit", 20, 50);
  const total = await Comment.countDocuments({ post: req.params.postId });
  const pages = Math.ceil(total / limit);
  const currentPage = Math.min(page, Math.max(pages, 1));
  const comments = await Comment.find({ post: req.params.postId })
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate("author", "name avatar");

  res.json({ comments, page: currentPage, pages: pages || 1, total });
});

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (typeof content !== "string" || !content.trim()) {
    res.status(400);
    throw new Error("Comment cannot be empty");
  }

  const post = await Post.findById(req.params.postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    content: content.trim(),
  });

  res.status(201).json(await comment.populate("author", "name avatar"));
});

// @desc    Delete a comment (comment author or post author)
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.commentId,
    post: req.params.postId,
  });

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const post = await Post.findById(comment.post);
  const isCommentAuthor =
    String(comment.author) === String(req.user._id);
  const isPostAuthor = post && String(post.author) === String(req.user._id);

  if (!isCommentAuthor && !isPostAuthor) {
    res.status(403);
    throw new Error("Not allowed to delete this comment");
  }

  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
});
