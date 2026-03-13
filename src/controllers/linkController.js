import User from "../models/User.js";

export const addLink = async (req, res) => {
  try {
    const { title, url, icon } = req.body;

    // 1. Validaciones básicas
    if (!title || !url) {
      return res.status(400).json({ msg: "Título y URL son obligatorios" });
    }

    // 2. Buscar al usuario y agregar el link al array
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // Creamos el nuevo objeto de link
    const newLink = { title, url, icon };

    // Lo agregamos al inicio del array (unshift) o al final (push)
    user.links.unshift(newLink);

    await user.save();

    // Devolvemos los links actualizados
    res.status(201).json(user.links);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al agregar el link");
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
    // Obtenemos el ID del link desde la URL
    const { id } = req.params;

    // Buscamos al usuario y removemos el link del array 'links'
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { links: { _id: id } } },
      { new: true }, // Para que devuelva el usuario actualizado
    );

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ msg: "Link eliminado correctamente", links: user.links });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar el link");
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
                    "links.$.icon": icon
                } 
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ msg: 'Link o usuario no encontrado' });
        }

        res.json({ msg: 'Link actualizado', links: user.links });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el link');
    }
};
