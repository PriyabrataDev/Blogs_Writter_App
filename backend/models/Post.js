import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [50000, "Content cannot exceed 50000 characters"],
    },
    coverImage: {
      type: String,
      default: "",
      maxlength: [2048, "Cover image URL cannot exceed 2048 characters"],
      match: [/^(https?:\/\/.+)?$/, "Cover image must be a URL"],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: [30, "Tags cannot exceed 30 characters"],
        },
      ],
      validate: {
        validator: (tags) => Array.isArray(tags) && tags.length <= 10,
        message: "A post cannot have more than 10 tags",
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1, _id: -1 });

export default mongoose.model("Post", postSchema);
