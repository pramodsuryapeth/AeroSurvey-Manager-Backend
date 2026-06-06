const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createDrone,
  getAllDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
  startCharging,
    stopCharging,
} = require("../controllers/droneController");

router.post("/", authMiddleware, createDrone);

router.get("/", authMiddleware, getAllDrones);

router.get("/:id", authMiddleware, getDroneById);

router.put("/:id", authMiddleware, updateDrone);

router.delete("/:id", authMiddleware, deleteDrone);

router.put("/:id/charge", authMiddleware, startCharging);

router.put("/:id/stop-charge", authMiddleware, stopCharging);

module.exports = router;