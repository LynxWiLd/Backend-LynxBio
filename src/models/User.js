import mongoose from "mongoose";

// 🪄 Constante para mantener un solo punto de verdad
const DEFAULT_AVATAR = "https://res.cloudinary.com/dqlm5tnhk/image/upload/v1773873679/IconProfile_hoxpyj.svg";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { type: String, required: true },
    profile: {
      bio: { 
        type: String, 
        default: "", 
        maxlength: 150 // 🛡️ Sincronizado con el frontend
      },
      avatarUrl: { 
        type: String, 
        default: DEFAULT_AVATAR // 🪄 Nace con el icono oficial
      },
    },
    theme: {
      backgroundColor: { type: String, default: "#ffffff" },
      backgroundImage: { type: String, default: "" }, 
      buttonColor: { type: String, default: "#007cf0" },
      buttonTextColor: { type: String, default: "#ffffff" },
      textColor: { type: String, default: "#000000" },
    },
    socials: {
      // 🪄 Agregamos trim para evitar errores en URLs
      instagram: { type: String, default: "", trim: true },
      github: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
    },
    links: [
      {
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        buttonColor: { type: String, default: "#000000" },
        buttonTextColor: { type: String, default: "#ffffff" },
        active: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true } // 📅 Crucial para auditoría de cuentas
);

export default mongoose.model("User", UserSchema);