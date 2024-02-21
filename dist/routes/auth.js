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
const user_1 = __importDefault(require("../db/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const SECRET = process.env.JWT_SECRET;
const userSignUpProps = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(7)
});
const userSignInProps = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(7)
});
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = userSignUpProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const password = body.data.password;
    const email = body.data.email;
    const user = yield user_1.default.findOne({ email });
    if (user) {
        return res.status(403).json({ msg: "User already exists" });
    }
    const newUserData = {
        email: email,
        password: password
    };
    const newUser = new user_1.default(newUserData);
    yield newUser.save();
    if (!SECRET) {
        console.error('JWT secret is not defined.');
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
    const token = jsonwebtoken_1.default.sign({ _id: newUser._id }, SECRET, { expiresIn: "1h" });
    res.status(200).json({
        msg: "User created Successfully",
        token: token,
        user: newUser
    });
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = userSignInProps.safeParse(req.body);
    if (!body.success) {
        return res.status(403).json({ msg: body.error });
    }
    const email = body.data.email;
    const password = body.data.password;
    const user = yield user_1.default.findOne({ email, password });
    if (!user) {
        return res.status(403).json({ msg: "User does not exist" });
    }
    if (!SECRET) {
        console.error('JWT secret is not defined.');
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
    const token = jsonwebtoken_1.default.sign({ _id: user._id }, SECRET, { expiresIn: "1h" });
    req.headers = {
        authorization: `Bearer ${token}`
    };
    res.status(200).json({
        msg: "Login Successfully",
        token: token,
        user: user
    });
}));
exports.default = router;
