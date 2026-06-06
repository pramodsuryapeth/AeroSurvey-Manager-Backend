const Mission = require("../models/Mission");
const Drone = require("../models/Drone");

const startMissionSimulation = async (
  io,
  missionId
) => {
  try {
    const mission =
      await Mission.findById(missionId);

    if (!mission) {
      console.log("Mission not found");
      return;
    }

    const drone =
      await Drone.findById(
        mission.drone
      );

    if (!drone) {
      console.log("Drone not found");
      return;
    }

    if (
      !mission.startLocation ||
      !mission.endLocation
    ) {
      console.log(
        "Mission location missing"
      );
      return;
    }

    const startLat =
      mission.currentLocation?.lat ??
      mission.startLocation.lat;

    const startLng =
      mission.currentLocation?.lng ??
      mission.startLocation.lng;

    const endLat =
      mission.endLocation.lat;

    const endLng =
      mission.endLocation.lng;

    let progress =
      mission.progress || 0;

    let batteryRemaining =
      drone.battery || 100;

    const estimatedTime =
      Number(
        mission.estimatedTime
      ) || 1;

    const totalSeconds =
      estimatedTime * 60;

    const intervalTime = 2000;

    const totalSteps =
      Math.max(
        1,
        Math.floor(
          totalSeconds /
            (intervalTime / 1000)
        )
      );

    const remainingSteps =
      Math.max(
        1,
        Math.floor(
          totalSteps *
            ((100 - progress) /
              100)
        )
      );

    const progressIncrement =
      (100 - progress) /
      remainingSteps;

    // Mission la fakt 30% battery use hoil
    const totalBatteryUsage = 30;

    let step = 0;

    const interval =
      setInterval(async () => {
        try {
          const latestMission =
            await Mission.findById(
              missionId
            );

          if (
            !latestMission
          ) {
            clearInterval(
              interval
            );
            return;
          }

          if (
            latestMission.status ===
              "paused" ||
            latestMission.status ===
              "aborted"
          ) {
            clearInterval(
              interval
            );
            return;
          }

          step++;

          progress +=
            progressIncrement;

          batteryRemaining -=
            totalBatteryUsage /
            totalSteps;

          if (
            batteryRemaining < 0
          ) {
            batteryRemaining = 0;
          }

          const lat =
            startLat +
            ((endLat -
              startLat) *
              step) /
              remainingSteps;

          const lng =
            startLng +
            ((endLng -
              startLng) *
              step) /
              remainingSteps;

          const safeProgress =
            Math.min(
              100,
              Math.round(
                progress
              )
            );

          const safeBattery =
            Math.max(
              0,
              Math.round(
                batteryRemaining
              )
            );

          let status =
            "in-progress";

          if (
            safeProgress >= 100
          ) {
            status =
              "completed";
          } else if (
            safeBattery <= 0
          ) {
            status =
              "aborted";
          }

          await Mission.findByIdAndUpdate(
            missionId,
            {
              progress:
                safeProgress,

              batteryRemaining:
                safeBattery,

              currentLocation:
                {
                  lat,
                  lng,
                },

              status,

              ...(status ===
              "completed"
                ? {
                    completedAt:
                      new Date(),
                  }
                : {}),
            }
          );

          await Drone.findByIdAndUpdate(
            drone._id,
            {
              battery:
                safeBattery,

              ...(status ===
                "completed" ||
              status ===
                "aborted"
                ? {
                    status:
                      "available",
                    lastActive:
                      new Date(),
                  }
                : {
                    status:
                      "in-mission",
                  }),
            }
          );

          io.emit(
            "mission-update",
            {
              missionId,
              progress:
                safeProgress,
              batteryRemaining:
                safeBattery,
              currentLocation:
                {
                  lat,
                  lng,
                },
              status,
            }
          );

          if (
            status ===
              "completed" ||
            status ===
              "aborted"
          ) {
            clearInterval(
              interval
            );
          }
        } catch (err) {
          console.error(
            err
          );
          clearInterval(
            interval
          );
        }
      }, intervalTime);
  } catch (error) {
    console.error(error);
  }
};

module.exports =
  startMissionSimulation;