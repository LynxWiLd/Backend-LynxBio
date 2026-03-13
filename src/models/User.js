import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String },
  active: { type: Boolean, default: true },
  clicks: { type: Number, default: 0 },
});

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
      displayName: String,
      bio: String,
      avatarUrl: String,
      bannerColor: { type: String, default: "#ffffff" },
    },
    theme: {
      backgroundColor: { type: String, default: "#000000" },
      buttonColor: { type: String, default: "#1f1f1f" },
      buttonTextColor: { type: String, default: "#ffffff" },
      fontFamily: { type: String, default: "sans-serif" },
    },
    links: [LinkSchema],
    socials: {
      instagram: String,
      twitter: String,
      github: String,
      tiktok: String,
    },
  },
  { timestamps: true },
);

// Exportación por defecto en ES Modules
export default mongoose.model("User", UserSchema);
