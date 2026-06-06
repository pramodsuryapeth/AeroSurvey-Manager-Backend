const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const {
  createMission,
  getAllMissions,
  getMissionById,
  updateMission,
  deleteMission,
  startMission,
   stopMission,
} = require("../controllers/missionController");

router.post(
  "/",
  authMiddleware,
  createMission
);

router.get(
  "/",
  authMiddleware,
  getAllMissions
);

router.get(
  "/:id",
  authMiddleware,
  getMissionById
);

router.put(
  "/:id",
  authMiddleware,
  updateMission
);

router.delete(
  "/:id",
  authMiddleware,
  deleteMission
);
router.put("/start/:id", authMiddleware, startMission);
router.put("/stop/:id", authMiddleware, stopMission);



module.exports = router;