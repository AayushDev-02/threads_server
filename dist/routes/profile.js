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
dotenv_1.default.config();
const router = express_1.default.Router();
const SECRET = process.env.JWT_SECRET;
const userProfileCreateProps = zod_1.z.object({
    username: zod_1.z.string().min(5).max(30),
    bio: zod_1.z.string().max(100),
    links: zod_1.z.record(zod_1.z.string().url()),
    avatar: zod_1.z.string().url(),
    location: zod_1.z.object({
        city: zod_1.z.string().max(20),
        state: zod_1.z.string().max(20),
        country: zod_1.z.string().max(20),
    }),
});
const userProfileUpdateProps = zod_1.z.object({
    username: zod_1.z.string().min(5).max(30).optional(),
    bio: zod_1.z.string().max(100).optional(),
    links: zod_1.z.record(zod_1.z.string().url()).optional(),
    avatar: zod_1.z.string().url().optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().max(20),
        state: zod_1.z.string().max(20),
        country: zod_1.z.string().max(20),
    }).optional(),
});
//Create User profile
router.post("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = userProfileCreateProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const username = body.data.username;
    const bio = body.data.bio;
    const links = body.data.links;
    const avatar = body.data.avatar;
    const city = body.data.location.city;
    const state = body.data.location.state;
    const country = body.data.location.country;
    const userId = req.headers["userId"];
    const existingProfile = yield profile_1.default.findOne({ userId });
    if (existingProfile) {
        return res.status(403).json({ msg: "Profile already exists" });
    }
    const newProfileData = {
        username: username,
        bio: bio,
        userId: userId,
        links: links,
        avatar: avatar,
        location: {
            city: city,
            state: state,
            country: country
        },
        followers: [],
        following: []
    };
    const newProfile = new profile_1.default(newProfileData);
    yield newProfile.save();
    res.status(200).json({
        msg: "Profile created Successfully",
        profile: newProfile
    });
}));
//GET CURRENT USER PROFILE
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers["userId"];
    const profile = yield profile_1.default.findOne({ userId });
    if (!profile) {
        return res.status(401).json({ msg: "Profile does not exists" });
    }
    res.status(200).json({
        profile: profile
    });
}));
//GET PROFILE BY ID
router.get("/:profileId", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileId = req.params.profileId;
    const profile = yield profile_1.default.findOne({ _id: profileId });
    if (!profile) {
        return res.status(401).json({ msg: "Profile does not exists" });
    }
    res.status(200).json({
        profile: profile
    });
}));
// GET ALL PROFILES
router.get("/current/all", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profiles = yield profile_1.default.find({});
        if (!profiles) {
            return res.status(404).json({ msg: "No profiles found" });
        }
        res.status(200).json({
            profiles: profiles
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
//GET PROFILE BY USERNAME
router.get("/find/:username", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.params.username;
    const profile = yield profile_1.default.findOne({ username });
    if (!profile) {
        return res.status(404).json({ msg: "Profile not found" });
    }
    res.status(200).json({
        profile: profile
    });
}));
//UPDATE PROFILE
router.patch("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = userProfileUpdateProps.safeParse(req.body);
    if (!body.success) {
        return res.status(401).json({ msg: body.error });
    }
    const updatedProfileData = body.data;
    const userId = req.headers["userId"];
    const response = yield profile_1.default.findOneAndUpdate({ userId }, updatedProfileData);
    if (!response) {
        res.status(500).json({ msg: "Internal server error" });
    }
    res.status(200).json({ msg: "Profile updated successfully" });
}));
//GET PROFILES NOT FOLLOWED BY CURRENT USER
router.get("/get/not-followed", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["userId"];
        const currentUserProfile = yield profile_1.default.findOne({ userId });
        if (!currentUserProfile) {
            return res.status(404).json({ msg: "Current user profile not found" });
        }
        const profilesNotFollowed = yield profile_1.default.find({
            _id: { $ne: currentUserProfile._id },
            followers: { $nin: [currentUserProfile._id] },
        });
        res.status(200).json({
            profilesNotFollowed: profilesNotFollowed,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
exports.default = router;
