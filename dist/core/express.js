"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = void 0;
/**
 * 入口文件
 */
const application_1 = require("./application");
function createApplication() {
    return new application_1.Application();
}
exports.createApplication = createApplication;
exports.default = createApplication;
