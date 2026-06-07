const Drone = require("../models/Drone");
const chargeDroneSimulation =
  require("../sockets/droneChargingSocket");
  const Mission = require("../models/Mission");

const { getIO } =
  require("../sockets/socket");

// CREATE
const createDrone = async (req, res) => {
  try {
    const drone = await Drone.create(req.body);

    res.status(201).json({
      success: true,
      drone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// READ ALL
const getAllDrones = async (req, res) => {
  try {
    const drones = await Drone.find();

    res.status(200).json({
      success: true,
      drones,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// READ ONE
// const Drone = require("../models/Drone");
// const Mission = require("../models/Mission");

const getDroneById = async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: "Drone not found",
      });
    }

    const missions = await Mission.find({
      drone: drone._id,
    }).sort({ createdAt: -1 });

    const stats = {
      totalMissions: missions.length,

      completedMissions: missions.filter(
        (m) => m.status === "completed"
      ).length,

      activeMissions: missions.filter(
        (m) => m.status === "in-progress"
      ).length,

      pendingMissions: missions.filter(
        (m) => m.status === "planned"
      ).length,

      totalDistance: missions.reduce(
        (sum, m) => sum + (m.distanceCovered || 0),
        0
      ),

      totalBatteryUsed: missions.reduce(
        (sum, m) => sum + (m.batteryUsage || 0),
        0
      ),

      totalFlightTime: missions.reduce(
        (sum, m) => sum + (m.actualDuration || 0),
        0
      ),
    };

    res.status(200).json({
      success: true,
      drone,
      missions,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
const updateDrone = async (req, res) => {
  try {
    const drone = await Drone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      drone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
const deleteDrone = async (req, res) => {
  try {
    await Drone.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Drone deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const chargeDrone = async (
  req,
  res
) => {
  try {
    const drone =
      await Drone.findById(
        req.params.id
      );

    if (!drone) {
      return res.status(404).json({
        success: false,
        message:
          "Drone not found",
      });
    }

    drone.status = "charging";

    drone.battery = 100;

    await drone.save();

    res.status(200).json({
      success: true,
      message:
        "Drone charged successfully",
      drone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

const startCharging = async ( req, res) => {
  try {
    const droneId =
      req.params.id;

    const drone =
      await Drone.findById(
        droneId
      );

    if (!drone) {
      return res.status(404).json({
        success: false,
        message:
          "Drone not found",
      });
    }

    // Already charging
    if (
      drone.status ===
      "charging"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Drone is already charging",
      });
    }

    // Active mission check
    const activeMission =
      await Mission.findOne({
        drone: droneId,
        status: "in-progress",
      });

    if (activeMission) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot charge drone while mission is in progress",
      });
    }

    const io = getIO();

    chargeDroneSimulation(
      io,
      droneId
    );

    res.status(200).json({
      success: true,
      message:
        "Charging started",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

const stopCharging = async (
  req,
  res
) => {
  try {
    const drone =
      await Drone.findById(
        req.params.id
      );

    if (!drone) {
      return res.status(404).json({
        success: false,
        message:
          "Drone not found",
      });
    }

    drone.status =
      "available";

    await drone.save();

    res.json({
      success: true,
      drone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

module.exports = {
  createDrone,
  getAllDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
  chargeDrone,
  startCharging,
  stopCharging,
};