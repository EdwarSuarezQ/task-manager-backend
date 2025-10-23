import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String, // type: es para especificar el tipo de dato
      required: true, // required: es para indicar que el campo es requerido
      trim: true, // trim: es para eliminar los espacios en blanco al inicio y al final
      unique: true, // unique: es para indicar que el campo debe ser único
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
