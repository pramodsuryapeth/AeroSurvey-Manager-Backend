const mongoose = require("mongoose");

const droneSchema = new mongoose.Schema(
{
    name: String,
    droneId: String,

    battery: {
        type: Number,
        default: 100,
    },
    batteryRemaining: {
  type: Number,
  default: 100,
},

    status: {
        type: String,
        enum: ["available", "in-mission", "charging"],
        default: "available",
    },

    lastActive: Date,
},
{ timestamps: true }
);

module.exports = mongoose.model("Drone", droneSchema);