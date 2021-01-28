"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePool = void 0;
var dotenv = require("dotenv");
dotenv.config();
var Pool = require("pg").Pool;
function makePool() {
    var pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    return pool;
}
exports.makePool = makePool;
