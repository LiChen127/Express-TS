"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareManager = void 0;
class MiddlewareManager {
    constructor() {
        this.middleware = [];
    }
    add(handler) {
        this.middleware.push(handler);
    }
    execute(req, res) {
        return new Promise((resolve, reject) => {
            let index = 0;
            const next = (err) => {
                if (err) {
                    return reject(err);
                }
                if (index >= this.middleware.length) {
                    return resolve();
                }
                const handler = this.middleware[index++];
                try {
                    handler(req, res, next);
                }
                catch (error) {
                    next(error);
                }
            };
            next();
        });
    }
}
exports.MiddlewareManager = MiddlewareManager;
