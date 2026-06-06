const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
    missionName: {
      type: String,
      required: true,
      trim: true,
    },

    drone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      required: true,
    },

    altitude: {
      type: Number,
      required: true,
    },

    surveyPattern: {
      type: String,
      enum: [
        "perimeter",
        "crosshatch",
      ],
      default: "perimeter",
    },

    status: {
      type: String,
      enum: [
        "planned",
        "in-progress",
        "paused",
        "completed",
        "aborted",
      ],
      default: "planned",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    batteryUsage: {
      type: Number,
      default: 0,
    },

    batteryRemaining: {
      type: Number,
      default: 100,
    },

    estimatedTime: {
      type: Number,
      default: 0,
    },

    actualDuration: {
      type: Number,
      default: 0,
    },

    distanceCovered: {
      type: Number,
      default: 0,
    },

    currentLocation: {
      lat: {
        type: Number,
        default: 18.5204,
      },

      lng: {
        type: Number,
        default: 73.8567,
      },
    },

    startLocation: {
      lat: {
        type: Number,
        required: true,
      },

      lng: {
        type: Number,
        required: true,
      },
    },

    endLocation: {
      lat: {
        type: Number,
        required: true,
      },

      lng: {
        type: Number,
        required: true,
      },
    },

    waypoints: [
      {
        lat: Number,
        lng: Number,
      },
    ],

    // User Selected Date
    missionDate: {
      type: String,
      required: true,
    },

    // User Selected Time
    missionStartTime: {
      type: String,
      required: true,
    },

    // Optional End Time
    missionEndTime: {
      type: String,
      default: "",
    },

    startedAt: {
      type: Date,
    },

    pausedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    abortedAt: {
      type: Date,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "Mission",
  missionSchema
);