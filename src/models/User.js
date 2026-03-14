import mongoose from "mongoose";

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
    // --- ACTUALIZAMOS EL THEME ---
    theme: {
      backgroundColor: { type: String, default: "#ffffff" },
      backgroundImage: { type: String, default: "" }, // Para la URL de Cloudinary
      buttonColor: { type: String, default: "#000000" },
      buttonTextColor: { type: String, default: "#ffffff" },
      textColor: { type: String, default: "#000000" }, // Para el color de nombre y bio
    },
    socials: {
      instagram: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    links: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        // 👇 Colores específicos para este botón
        buttonColor: { type: String, default: "#000000" },
        buttonTextColor: { type: String, default: "#ffffff" },
        active: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);
