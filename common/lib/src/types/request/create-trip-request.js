"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTripRequestSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.CreateTripRequestSchema = zod_1.default.object({
    name: zod_1.default.string(),
    description: zod_1.default.string().optional(),
    start_date: zod_1.default.string(),
    end_date: zod_1.default.string().optional(),
});
//# sourceMappingURL=create-trip-request.js.map