import express from "express";
import { authorize, callback } from "../controllers/authController.js";

const router = express.Router();

router.get("/authorize", authorize);
router.get("/callback", callback);

export default router;
