const Mission = require("../models/Mission");
const startMissionSimulation = require("../sockets/missionSocket");
const Drone = require("../models/Drone");
const { getIO } = require("../sockets/socket");

// CREATE
exports.createMission = async (req, res) => {
  try {
    const {
      drone,
      missionDate,
      missionStartTime,
      estimatedTime,
    } = req.body;

    // Check Drone Exists
    const selectedDrone =
      await Drone.findById(drone);

    if (!selectedDrone) {
      return res.status(404).json({
        success: false,
        message: "Drone not found",
      });
    }

    // Mission Date & Time Validation
    const missionDateTime =
      new Date(
        `${missionDate}T${missionStartTime}`
      );

    const currentDateTime =
      new Date();

    if (
      missionDateTime <
      currentDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mission cannot be scheduled in the past",
      });
    }

    // Battery Validation
    if (
      selectedDrone.batteryRemaining <
      20
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Drone battery is too low for mission",
      });
    }

    // Drone Status Validation
    if (
      selectedDrone.status ===
      "in-mission"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Drone is already in an active mission",
      });
    }

    // Mission Time Slot Conflict Check

    const existingMissions =
      await Mission.find({
        drone,
        status: {
          $in: [
            "planned",
            "in-progress",
            "paused",
          ],
        },
      });

    const requestedStart =
      new Date(
        `${missionDate}T${missionStartTime}`
      );

    const requestedEnd =
      new Date(
        requestedStart.getTime() +
          Number(
            estimatedTime || 0
          ) *
            60000
      );

    for (const mission of existingMissions) {
      const missionStart =
        new Date(
          `${mission.missionDate}T${mission.missionStartTime}`
        );

      const missionEnd =
        new Date(
          missionStart.getTime() +
            Number(
              mission.estimatedTime ||
                0
            ) *
              60000
        );

      const isOverlap =
        requestedStart <
          missionEnd &&
        requestedEnd >
          missionStart;

      if (isOverlap) {
        return res.status(400).json({
          success: false,
          message:
            "This drone is already assigned to another mission during the selected time slot",
        });
      }
    }

    // Create Mission

    const mission =
      await Mission.create(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Mission created successfully",
      mission,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// GET ALL
exports.getAllMissions = async (req, res) => {
  try {
    const missions = await Mission.find()
      .populate("drone");

    res.status(200).json({
      success: true,
      missions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE
exports.getMissionById = async (req, res) => {
  try {
    const mission = await Mission.findById(
      req.params.id
    ).populate("drone");

    res.status(200).json({
      success: true,
      mission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
exports.updateMission = async (req, res) => {
  try {
    const mission =
      await Mission.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.status(200).json({
      success: true,
      mission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
exports.deleteMission = async (req, res) => {
  try {
    await Mission.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Mission deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};







exports.startMission = async (req, res) => {
  try {
    const mission = await Mission.findById(
      req.params.id
    );

    if (!mission) {
      return res.status(404).json({
        message: "Mission not found",
      });
    }

    if (mission.status === "completed") {
      return res.status(400).json({
        message: "Mission already completed",
      });
    }

    const drone = await Drone.findById(
      mission.drone
    );

    if (!drone) {
      return res.status(404).json({
        message: "Drone not found",
      });
    }

    if (drone.battery < 20) {
      return res.status(400).json({
        message:
          "Battery too low for mission",
      });
    }

    drone.status = "in-mission";
    await drone.save();

    mission.status = "in-progress";

    if (!mission.startedAt) {
      mission.startedAt = new Date();
    }

    await mission.save();

    const io = getIO();

    startMissionSimulation(
      io,
      mission._id
    );

    res.status(200).json({
      success: true,
      message: "Mission Started",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

exports.stopMission = async (
  req,
  res
) => {
  try {
    const mission =
      await Mission.findById(
        req.params.id
      );

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found",
      });
    }

    mission.status = "paused";

    await mission.save();

    await Drone.findByIdAndUpdate(
      mission.drone,
      {
        status: "available",
        lastActive: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Mission Paused",
      progress: mission.progress,
      batteryRemaining:
        mission.batteryRemaining,
      currentLocation:
        mission.currentLocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};