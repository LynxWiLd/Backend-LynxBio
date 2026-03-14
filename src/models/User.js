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
      bio: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
    },
    theme: {
      backgroundColor: { type: String, default: "#ffffff" },
      buttonColor: { type: String, default: "#000000" },
      buttonTextColor: { type: String, default: "#ffffff" },
    },
    // 👇 ESTO ES LO QUE NECESITAMOS
    socials: {
      instagram: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    links: [
      {
        title: String,
        url: String,
      },
    ],
  },
  { timestamps: true },
);

// Exportación por defecto en ES Modules
export default mongoose.model("User", UserSchema);
