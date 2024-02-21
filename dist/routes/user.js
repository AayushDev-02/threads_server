"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("../middleware/auth"));
const profile_1 = __importDefault(require("../db/profile"));
const user_1 = __importDefault(require("../db/user"));
dotenv_1.default.config();
const router = express_1.default.Router();
const userUpdateProps = zod_1.z.object({
    password: zod_1.z.string().min(7)
});
//Follow other user
router.post("/follow/:profileId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileId = req.params.profileId;
    const currentUserId = req.headers["userId"];
    const currentProfile = yield profile_1.default.findOneAndUpdate({ userId: currentUserId, following: { $nin: profileId } }, { $push: { following: profileId } }, { new: true });
    if (!currentProfile) {
        return res.status(404).json({ msg: "Current user not found" });
    }
    const profileToFollow = yield profile_1.default.findOneAndUpdate({ _id: profileId, followers: { $ne: currentProfile._id } }, { $push: { followers: currentProfile._id } }, { new: true });
    if (!profileToFollow) {
        return res.status(404).json({ msg: "User to follow not found" });
    }
    res.status(200).json({ msg: "Successfully followed user" });
}));
// Unfollow user
router.post("/unfollow/:profileId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const currentUserId = req.headers["userId"];
        const currentProfile = yield profile_1.default.findOneAndUpdate({ userId: currentUserId, following: profileId }, { $pull: { following: profileId } }, { new: true });
        if (!currentProfile) {
            return res.status(404).json({ msg: "Current user not found or not following the specified user" });
        }
        const profileToUnfollow = yield profile_1.default.findOneAndUpdate({ _id: profileId, followers: currentProfile._id }, { $pull: { followers: currentProfile._id } }, { new: true });
        if (!profileToUnfollow) {
            return res.status(404).json({ msg: "User to unfollow not found or not being followed by the current user" });
        }
        res.status(200).json({ msg: "Successfully unfollowed user" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
// Get All Followers
router.get("/followers", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.headers["userId"];
        const currentUser = yield profile_1.default.findOne({ _id: currentUserId }).populate("followers", "_id username");
        if (!currentUser) {
            return res.status(404).json({ msg: "Current user not found" });
        }
        res.status(200).json({ followers: currentUser.followers });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
router.get("/followers/:profileId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const profile = yield profile_1.default.findOne({ _id: profileId }).populate("followers", "_id username bio");
        if (!profile) {
            return res.status(404).json({ msg: "Current user not found" });
        }
        res.status(200).json({ followers: profile.followers });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
// Get All Following
router.get("/following", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.headers["userId"];
        const currentUser = yield profile_1.default.findOne({ _id: currentUserId }).populate("following", "_id username");
        if (!currentUser) {
            return res.status(404).json({ msg: "Current user not found" });
        }
        res.status(200).json({ following: currentUser.following });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
router.get("/following/:profileId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const profile = yield profile_1.default.findOne({ _id: profileId }).populate("following", "_id username bio");
        if (!profile) {
            return res.status(404).json({ msg: "Current user not found" });
        }
        res.status(200).json({ following: profile.following });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
router.get("/me", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["userId"];
        const userData = yield user_1.default.findOne({ _id: userId });
        if (!userData) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.status(200).json({ msg: "User data Successfully", data: userData });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
router.patch("/update/password", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = userUpdateProps.safeParse(req.body);
        if (!body.success) {
            return res.status(403).json({ msg: body.error });
        }
        const userId = req.headers["userId"];
        const userData = yield user_1.default.findOneAndUpdate({ _id: userId }, { password: body.data.password }, { new: true });
        if (!userData) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.status(200).json({ msg: "User Updated Successfully", data: userData });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
exports.default = router;
