"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = createApplication;
/**
 * 入口文件
 */
var application_1 = require("./application");
function createApplication() {
    return new application_1.Application();
}
exports.default = createApplication;
