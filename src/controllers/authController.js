import { authenticateAndSaveUser } from "../services/authService.js";

export const authorize = (req, res) => {
  const ghlAuthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&client_id=${process.env.GHL_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${process.env.GHL_SCOPES}`;
  res.redirect(ghlAuthUrl);
};

export const callback = async (req, res) => {
  const { code } = req.query;
  if (!code)
    return res.status(400).json({ error: "No authorization code provided" });

  try {
    await authenticateAndSaveUser(code);
    return res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
