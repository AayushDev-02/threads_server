"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const profileSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", unique: true },
    username: { type: String, unique: true },
    bio: String,
    links: {
        type: Map,
        of: String,
    },
    avatar: String,
    location: {
        city: String,
        state: String,
        country: String,
    },
    followers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Profile" }],
    following: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Profile" }],
});
profileSchema.virtual("followersCount").get(function () {
    return this.following ? this.followers.length : 0;
});
profileSchema.virtual("followingCount").get(function () {
    return this.following ? this.following.length : 0;
});
profileSchema.set("toJSON", { virtuals: true });
const Profile = mongoose_1.default.model("Profile", profileSchema);
exports.default = Profile;
