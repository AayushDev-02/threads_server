"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const profile_1 = __importDefault(require("./routes/profile"));
const user_1 = __importDefault(require("./routes/user"));
const thread_1 = __importDefault(require("./routes/thread"));
dotenv_1.default.config();
const port = process.env.PORT;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/auth", auth_1.default);
app.use("/profile", profile_1.default);
app.use("/user", user_1.default);
app.use("/thread", thread_1.default);
mongoose_1.default.connect(process.env.MONGO_URI || "", { dbName: "threads" });
app.listen(port, () => {
    console.log("Server running on port : ", port);
});
