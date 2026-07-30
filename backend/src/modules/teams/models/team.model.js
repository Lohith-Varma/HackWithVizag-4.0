import mongoose from "mongoose";
import { TEAM_STATUSES } from "../../../utils/constants.js";

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [2, "Team name must be at least 2 characters"],
      maxlength: [100, "Team name must not exceed 100 characters"],
      unique: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team leader is required"],
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentStatus: {
      type: String,
      enum: TEAM_STATUSES,
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

teamSchema.pre("validate", function ensureLeaderInMembers(next) {
  if (this.leader && !this.members.some((member) => member.toString() === this.leader.toString())) {
    this.members.unshift(this.leader);
  }

  next();
});

const Team = mongoose.model("Team", teamSchema);

export default Team;
