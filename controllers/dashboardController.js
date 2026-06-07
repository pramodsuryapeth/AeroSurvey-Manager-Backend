const Drone = require("../models/Drone");
const Mission = require("../models/Mission");

exports.getDashboardData =
  async (req, res) => {
    try {
      const [
        totalDrones,
        totalMissions,
        availableDrones,
        chargingDrones,
        activeMissions,
        completedMissions,
        abortedMissions,
        drones,
      ] = await Promise.all([
        Drone.countDocuments(),
        Mission.countDocuments(),

        Drone.countDocuments({
          status: "available",
        }),

        Drone.countDocuments({
          status: "charging",
        }),

        Mission.countDocuments({
          status: "in-progress",
        }),

        Mission.countDocuments({
          status: "completed",
        }),

        Mission.countDocuments({
          status: "aborted",
        }),

        Drone.find(),
      ]);

      const lowBatteryDrones =
        drones.filter(
          (d) => d.battery <= 20
        ).length;

      const averageBattery =
        drones.length > 0
          ? Math.round(
              drones.reduce(
                (sum, d) =>
                  sum + d.battery,
                0
              ) / drones.length
            )
          : 0;

      const recentMissions =
        await Mission.find()
          .populate("drone")
          .sort({
            createdAt: -1,
          })
          .limit(10);

      const activeMapMissions =
  await Mission.find({
    status: "in-progress",
  })
    .populate("drone")
    .select(`
      missionName
      status
      progress
      batteryRemaining
      currentLocation
      startLocation
      endLocation
      surveyPattern
      waypoints
      drone
    `);

      const notifications = [];

      recentMissions.forEach(
        (mission) => {
          if (
            mission.status ===
            "completed"
          ) {
            notifications.push({
              id: mission._id,
              type: "success",
              message: `${mission.missionName} completed`,
              time:
                mission.updatedAt,
            });
          }

          if (
            mission.status ===
            "in-progress"
          ) {
            notifications.push({
              id: mission._id,
              type: "info",
              message: `${mission.missionName} running`,
              time:
                mission.updatedAt,
            });
          }

          if (
            mission.status ===
            "aborted"
          ) {
            notifications.push({
              id: mission._id,
              type: "danger",
              message: `${mission.missionName} aborted`,
              time:
                mission.updatedAt,
            });
          }
        }
      );

      drones.forEach((drone) => {
        if (
          drone.battery <= 20
        ) {
          notifications.push({
            id:
              drone._id +
              "-battery",
            type: "warning",
            message: `${drone.name} battery low (${drone.battery}%)`,
            time:
              drone.updatedAt,
          });
        }

        if (
          drone.status ===
          "charging"
        ) {
          notifications.push({
            id:
              drone._id +
              "-charging",
            type: "info",
            message: `${drone.name} charging`,
            time:
              drone.updatedAt,
          });
        }
      });

      res.status(200).json({
        success: true,

        stats: {
          totalDrones,
          availableDrones,
          chargingDrones,

          totalMissions,
          activeMissions,
          completedMissions,
          abortedMissions,

          lowBatteryDrones,
          averageBattery,
        },

        recentMissions,

        activeMapMissions,

        notifications,
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