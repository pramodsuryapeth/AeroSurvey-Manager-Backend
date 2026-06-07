const Mission = require("../models/Mission");
const Drone = require("../models/Drone");
const { getIO } = require("../sockets/socket");
const startMissionSimulation = require("../sockets/missionSocket");

const startScheduledMissions = async () => {
  try {
    const now = new Date();

    console.log("\n============================");
    console.log("⏰ Scheduler Tick:", now);
    console.log("============================");

    const missions = await Mission.find({
      status: "planned",
    });

    console.log(
      `📋 Planned Missions Found: ${missions.length}`
    );

    for (const mission of missions) {
      console.log("\n----------------------------");
      console.log(
        `🚁 Checking Mission: ${mission.missionName}`
      );
      console.log("----------------------------");

      console.log("Mission ID:", mission._id);
      console.log("Mission Date:", mission.missionDate);
      console.log(
        "Mission Start Time:",
        mission.missionStartTime
      );
      console.log("Mission Status:", mission.status);

      if (
        !mission.missionDate ||
        !mission.missionStartTime
      ) {
        console.log(
          "❌ Missing missionDate or missionStartTime"
        );
        continue;
      }

      const missionDateTime = new Date(
  `${mission.missionDate}T${mission.missionStartTime}:00+05:30`
);

      console.log("Current Time:", now);
      console.log(
        "Mission DateTime:",
        missionDateTime
      );

      if (missionDateTime > now) {
        console.log(
          "⏳ Scheduled time not reached yet"
        );
        continue;
      }

      const drone = await Drone.findById(
        mission.drone
      );

      console.log(
        "Drone ID:",
        mission.drone
      );

      if (!drone) {
        console.log(
          `❌ ${mission.missionName} - Drone not found`
        );
        continue;
      }

      console.log(
        "Drone Name:",
        drone.name
      );
      console.log(
        "Drone Status:",
        drone.status
      );
      console.log(
        "Battery Remaining:",
        drone.batteryRemaining
      );
      console.log(
        "Battery:",
        drone.battery
      );

      const batteryLevel =
        drone.batteryRemaining ??
        drone.battery;

      if (batteryLevel < 30) {
        console.log(
          `❌ ${mission.missionName} - Low Battery (${batteryLevel}%)`
        );
        continue;
      }

      if (
        drone.status === "charging"
      ) {
        console.log(
          `❌ ${mission.missionName} - Drone Charging`
        );
        continue;
      }

      if (
        drone.status === "in-mission"
      ) {
        console.log(
          `❌ ${mission.missionName} - Drone Busy`
        );
        continue;
      }

      const activeMission =
        await Mission.findOne({
          drone: mission.drone,
          status: "in-progress",
          _id: {
            $ne: mission._id,
          },
        });

      console.log(
        "Active Mission:",
        activeMission
          ? activeMission.missionName
          : "None"
      );

      if (activeMission) {
        console.log(
          `❌ ${mission.missionName} - Another mission running`
        );
        continue;
      }

      console.log(
        "✅ All checks passed"
      );

      drone.status =
        "in-mission";

      await drone.save();

      console.log(
        "✅ Drone status updated"
      );

      mission.status =
        "in-progress";

      if (!mission.startedAt) {
        mission.startedAt =
          new Date();
      }

      await mission.save();

      console.log(
        "✅ Mission status updated"
      );

      const io = getIO();

      console.log(
        "📡 Starting Mission Simulation..."
      );

      try {
        startMissionSimulation(
          io,
          mission._id
        );

        console.log(
          "✅ Mission Simulation Started"
        );
      } catch (err) {
        console.error(
          "❌ Simulation Error:",
          err
        );
      }

      console.log(
        `🚀 AUTO STARTED: ${mission.missionName}`
      );
    }
  } catch (error) {
    console.error(
      "❌ Mission Scheduler Error:",
      error
    );
  }
};

module.exports =
  startScheduledMissions;