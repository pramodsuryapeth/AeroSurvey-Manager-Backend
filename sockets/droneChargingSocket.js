const Drone =
  require("../models/Drone");

const chargeDroneSimulation =
  (io, droneId) => {
    const interval =
      setInterval(async () => {
        const drone =
          await Drone.findById(
            droneId
          );

        if (!drone) {
          clearInterval(
            interval
          );
          return;
        }

        let battery =
          drone.battery + 5;

        if (battery >= 100) {
          battery = 100;

          await Drone.findByIdAndUpdate(
            droneId,
            {
              battery,
              status:
                "available",
            }
          );

          io.emit(
            "drone-charging",
            {
              droneId,
              battery,
              status:
                "available",
            }
          );

          clearInterval(
            interval
          );

          return;
        }

        await Drone.findByIdAndUpdate(
          droneId,
          {
            battery,
            status:
              "charging",
          }
        );

        io.emit(
          "drone-charging",
          {
            droneId,
            battery,
            status:
              "charging",
          }
        );
      }, 2000);
  };

module.exports =
  chargeDroneSimulation;