"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("../core/express");
var app = (0, express_1.default)();
app.use(function (req, res, next) {
    console.log("".concat(req.method, " ").concat(req.url));
    next();
});
app.use(function (req, res) {
    res.end('Hello World');
});
app.listen(3000, function () {
    console.log('Server is running on port 3000');
});
