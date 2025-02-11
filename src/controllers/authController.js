import axios from "axios";

export const authorize = (req, res) => {
  const ghlAuthUrl = `https://marketplace.gohighlevel.com/oauth/authorize?response_type=code&client_id=${process.env.GHL_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=contacts.read opportunities.write`;
  res.redirect(ghlAuthUrl);
};

export const callback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No authorization code provided" });

  try {
    const response = await axios.post("https://marketplace.gohighlevel.com/oauth/token", {
      grant_type: "authorization_code",
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
    });

    const { access_token, refresh_token } = response.data;
    res.json({ access_token, refresh_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
