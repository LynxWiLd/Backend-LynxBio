import User from "../models/User.js";

// 1. OBTENER TODOS LOS LINKS
export const getLinks = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("links");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user.links);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los links");
  }
};

// 2. AGREGAR UN LINK
export const addLink = async (req, res) => {
  try {
    const { title, url, buttonColor, buttonTextColor, icon } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const newLink = {
      title,
      url,
      icon: icon || "FaGlobe",
      buttonColor: buttonColor || "#000000",
      buttonTextColor: buttonTextColor || "#ffffff",
    };

    user.links.push(newLink);
    await user.save();

    res.status(201).json(user.links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al agregar link" });
  }
};

// 3. EDITAR UN LINK
export const updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, icon, buttonColor, buttonTextColor } = req.body;

    // Usamos el operador $set para actualizar campos específicos del subdocumento
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "links._id": id },
      {
        $set: {
          "links.$.title": title,
          "links.$.url": url,
          "links.$.icon": icon,
          "links.$.buttonColor": buttonColor,
          "links.$.buttonTextColor": buttonTextColor,
        },
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ msg: "Link no encontrado" });

    res.json({ msg: "Link actualizado", links: user.links });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar el link");
  }
};

// 4. ELIMINAR UN LINK
export const deleteLink = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    user.links = user.links.filter(
      (link) => link._id.toString() !== req.params.id
    );

    await user.save();
    res.json(user.links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al eliminar" });
  }
};

// 5. 🪄 REORDENAR LINKS (Esta es la que faltaba para el Drag & Drop)
export const reorderLinks = async (req, res) => {
  try {
    const { newOrder } = req.body; // Recibimos el array de IDs en orden: ["id1", "id2"...]
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // Mapeamos el nuevo orden de IDs a los objetos reales del array original de la DB
    const reorderedLinks = newOrder.map(id => 
      user.links.find(link => link._id.toString() === id)
    ).filter(link => link !== undefined); // Filtro de seguridad

    user.links = reorderedLinks;
    await user.save();

    res.json(user.links);
  } catch (err) {
    console.error("ERROR EN REORDER:", err);
    res.status(500).json({ msg: "Error al guardar el nuevo orden" });
  }
};