const Mission = require("../models/Mission");
const Drone = require("../models/Drone");
const { getIO } = require("../sockets/socket");
const startMissionSimulation = require("../sockets/missionSocket");

const startScheduledMissions = async () => {
  try {
    const now = new Date();

    const missions = await Mission.find({
      status: "planned",
    });

    for (const mission of missions) {

      // Date & Time validation
      if (
        !mission.missionDate ||
        !mission.missionStartTime
      ) {
        continue;
      }

      const missionDateTime = new Date(
        `${mission.missionDate}T${mission.missionStartTime}:00`
      );

      // Scheduled time not reached
      if (missionDateTime > now) {
        continue;
      }

      const drone = await Drone.findById(
        mission.drone
      );

      // Drone not found
      if (!drone) {
        console.log(
          `❌ ${mission.missionName} - Drone not found`
        );
        continue;
      }

      // Battery check
      if (
        (drone.batteryRemaining ??
          drone.battery) < 30
      ) {
        console.log(
          `❌ ${mission.missionName} - Low Battery`
        );
        continue;
      }

      // Drone charging
      if (
        drone.status === "charging"
      ) {
        console.log(
          `❌ ${mission.missionName} - Drone Charging`
        );
        continue;
      }

      // Drone already in mission
      if (
        drone.status === "in-mission"
      ) {
        console.log(
          `❌ ${mission.missionName} - Drone Busy`
        );
        continue;
      }

      // Same drone active mission
      const activeMission =
        await Mission.findOne({
          drone: mission.drone,
          status: "in-progress",
          _id: {
            $ne: mission._id,
          },
        });

      if (activeMission) {
        console.log(
          `❌ ${mission.missionName} - Another mission running`
        );
        continue;
      }

      // Start Mission
      drone.status = "in-mission";
      await drone.save();

      mission.status =
        "in-progress";

      if (!mission.startedAt) {
        mission.startedAt =
          new Date();
      }

      await mission.save();

      const io = getIO();

      startMissionSimulation(
        io,
        mission._id
      );

      console.log(
        `🚁 Auto Started: ${mission.missionName}`
      );
    }
  } catch (error) {
    console.error(
      "Mission Scheduler Error:",
      error
    );
  }
};

module.exports =
  startScheduledMissions;