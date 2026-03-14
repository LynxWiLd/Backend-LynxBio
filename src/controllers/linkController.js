import User from "../models/User.js";

export const addLink = async (req, res) => {
  try {
    // 1. Extraemos TODO lo que manda el frontend, incluyendo los colores
    const { title, url, buttonColor, buttonTextColor } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // 2. Creamos el objeto del link con los colores
    const newLink = {
      title,
      url,
      buttonColor: buttonColor || "#000000", // Valor por defecto si viene vacío
      buttonTextColor: buttonTextColor || "#ffffff",
    };

    user.links.push(newLink);
    await user.save();

    res.status(201).json(user.links);
  } catch (err) {
    res.status(500).json({ msg: "Error al agregar link" });
  }
};
export const getLinks = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("links");
    res.json(user.links);
  } catch (err) {
    res.status(500).send("Error al obtener los links");
  }
};
export const deleteLink = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Filtramos el array para quitar el link con ese ID
    user.links = user.links.filter(
      (link) => link._id.toString() !== req.params.id,
    );

    await user.save();

    // Devolvemos la lista actualizada (esto es lo que recibe res.data en el front)
    res.json(user.links);
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar" });
  }
};
// Agregá esta función al final de src/controllers/linkController.js

export const updateLink = async (req, res) => {
  try {
    const { id } = req.params; // ID del link a editar
    const { title, url, icon } = req.body;

    // Buscamos al usuario y el link específico dentro de su array
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "links._id": id },
      {
        $set: {
          "links.$.title": title,
          "links.$.url": url,
          "links.$.icon": icon,
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ msg: "Link o usuario no encontrado" });
    }

    res.json({ msg: "Link actualizado", links: user.links });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar el link");
  }
};
