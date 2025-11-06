export const getWebUser = (req, res) => {
  try {
    const user = req.webUser;
    res.json(user);
  } catch (error) {
    console.error("Error getting web user", error);
    res.status(500).json({ error: "Internal server error" });
  }
};