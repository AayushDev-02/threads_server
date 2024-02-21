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
const thread_1 = __importDefault(require("../db/thread"));
dotenv_1.default.config();
const router = express_1.default.Router();
const ThreadCreateProps = zod_1.z.object({
    profileId: zod_1.z.string(),
    content: zod_1.z.string().max(200),
    images: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        caption: zod_1.z.string().max(100)
    })).optional(),
});
const ThreadUpdateProps = zod_1.z.object({
    content: zod_1.z.string().max(200),
    images: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        caption: zod_1.z.string().max(100)
    })).optional(),
});
const CommnetCreateProps = zod_1.z.object({
    profileId: zod_1.z.string(),
    content: zod_1.z.string().max(200),
});
// CREATE THREAD
router.post('/create', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = ThreadCreateProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const userId = req.headers['userId'];
    const profileId = body.data.profileId;
    const content = body.data.content;
    const images = body.data.images;
    const newThreadData = {
        user: userId,
        profile: profileId,
        content: content,
        images: images,
        comments: [],
        likes: [],
    };
    const newThread = new thread_1.default(newThreadData);
    yield newThread.save();
    if (!newThread) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
    res.status(200).json({
        msg: 'Thread created successfully',
        data: newThread,
    });
}));
// UPDATE THREAD BY ID
router.patch('/:threadId', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = ThreadUpdateProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const userId = req.headers['userId'];
    const content = body.data.content;
    const images = body.data.images;
    const threadId = req.params.threadId;
    const updatedThreadData = {
        content: content,
        images: images,
    };
    const updatedThread = yield thread_1.default.findOneAndUpdate({ _id: threadId, user: userId }, updatedThreadData, { new: true });
    if (!updatedThread) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
    res.status(200).json({
        msg: 'Thread updated successfully',
        data: updatedThread,
    });
}));
// DELETE THREAD BY ID
router.delete('/:threadId', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userId'];
    const threadId = req.params.threadId;
    const deletedThread = yield thread_1.default.findOneAndDelete({
        _id: threadId,
        user: userId,
    });
    if (!deletedThread) {
        return res.status(404).json({ msg: 'Thread not found' });
    }
    res.status(200).json({
        msg: 'Thread deleted successfully',
        data: deletedThread,
    });
}));
// GET THREADS BY USER
router.get('/user/:userId', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const userThreads = yield thread_1.default.find({ user: userId }).populate('profile user comments.profile');
    res.status(200).json({
        threads: userThreads,
    });
}));
// GET THREADS BY PROFILE
router.get('/profile/:profileId', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileId = req.params.profileId;
    const userThreads = yield thread_1.default.find({ profile: profileId }).populate('profile user comments.profile');
    res.status(200).json({
        threads: userThreads,
    });
}));
// GET CURRENT USER THREADS
router.get('/current', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUserId = req.headers['userId'];
    const currentUserThreads = yield thread_1.default.find({ user: currentUserId }).populate('profile user comments.profile');
    res.status(200).json({
        threads: currentUserThreads,
    });
}));
//POST A COMMENT ON THREAD 
router.post('/:threadId/comment', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = CommnetCreateProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const userId = req.headers['userId'];
    const threadId = req.params.threadId;
    const content = body.data.content;
    const profileId = body.data.profileId;
    const newComment = {
        user: userId,
        profile: profileId,
        content: content,
        likes: [],
    };
    const updatedThread = yield thread_1.default.findByIdAndUpdate(threadId, { $push: { comments: newComment } }, { new: true }).populate('comments.user');
    if (!updatedThread) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
    res.status(200).json({
        msg: 'Comment added successfully',
        data: updatedThread,
    });
}));
//   LIKE A THREAD 
router.post('/:threadId/like', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userId'];
    const threadId = req.params.threadId;
    const updatedThread = yield thread_1.default.findByIdAndUpdate(threadId, { $addToSet: { likes: userId } }, { new: true });
    if (!updatedThread) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
    res.status(200).json({
        msg: 'Thread liked successfully',
        data: updatedThread,
    });
}));
//   LIKE A COMMENT IN A THREAD
router.post('/:threadId/comment/:commentId/like', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userId'];
    const threadId = req.params.threadId;
    const commentId = req.params.commentId;
    const updatedThread = yield thread_1.default.findOneAndUpdate({ _id: threadId, 'comments._id': commentId }, { $addToSet: { 'comments.$.likes': userId } }, { new: true }).populate('comments.user');
    if (!updatedThread) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
    res.status(200).json({
        msg: 'Comment liked successfully',
        data: updatedThread,
    });
}));
//GET ALL THREADS
router.get('/all', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allThreads = yield thread_1.default.find().populate('profile user comments.profile');
        res.status(200).json({
            threads: allThreads,
        });
    }
    catch (error) {
        res.status(500).json({ msg: 'Internal server error' });
    }
}));
// GET THREADS OF FOLLOWED PROFILES
router.get('/followed', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.headers['userId'];
        const currentUserProfile = yield profile_1.default.findOne({ userId: currentUserId });
        if (!currentUserProfile) {
            return res.status(404).json({ msg: 'User profile not found' });
        }
        const followedProfilesThreads = yield thread_1.default.find({ profile: { $in: currentUserProfile.following } }).populate('profile user comments.profile');
        res.status(200).json({
            threads: followedProfilesThreads,
        });
    }
    catch (error) {
        res.status(500).json({ msg: 'Internal server error' });
    }
}));
exports.default = router;
