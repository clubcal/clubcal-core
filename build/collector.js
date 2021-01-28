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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var Twitter = require("twitter");
var matchAll = require("match-all");
var fetch = require("node-fetch");
var pg_conn_1 = require("./pg_conn");
dotenv.config();
var TW_CONSUMER_KEY = process.env.TW_CONSUMER_KEY || "XXXXXXXXXXXXXXXXX";
var TW_CONSUMER_SEC = process.env.TW_CONSUMER_SEC || "XXXXXXXXXXXXXXXXX";
var TW_ACCESS_TOKEN_KEY = process.env.TW_ACCESS_TOKEN_KEY || "XXXXXXXXXXXXXXXXX";
var TW_ACCESS_TOKEN_SEC = process.env.TW_ACCESS_TOKEN_SEC || "XXXXXXXXXXXXXXXXX";
var client = new Twitter({
    consumer_key: TW_CONSUMER_KEY,
    consumer_secret: TW_CONSUMER_SEC,
    access_token_key: TW_ACCESS_TOKEN_KEY,
    access_token_secret: TW_ACCESS_TOKEN_SEC
});
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var pool;
        return __generator(this, function (_a) {
            pool = pg_conn_1.makePool();
            client.stream("statuses/filter", {
                track: "joinclubhouse"
                //locations: '18.3074488,-34.3583284,19.0046700,-33.4712700'
            }, function (stream) {
                stream.on("data", function (tweet) {
                    return __awaiter(this, void 0, void 0, function () {
                        var _i, _a, url, expanded_url, match;
                        var _this = this;
                        return __generator(this, function (_b) {
                            for (_i = 0, _a = tweet.entities.urls; _i < _a.length; _i++) {
                                url = _a[_i];
                                expanded_url = url.expanded_url;
                                match = expanded_url.match(/^(http|https):\/\/[www.]*joinclubhouse.com\/event\/(.*)$/);
                                if (match === null) {
                                    continue;
                                }
                                fetchContent(match[0], function (_a) {
                                    var nameRoom = _a.nameRoom, withRoom = _a.withRoom, descRoom = _a.descRoom, dateRoom = _a.dateRoom, linkRoom = _a.linkRoom;
                                    return __awaiter(_this, void 0, void 0, function () {
                                        var result, error_1;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _b.trys.push([0, 2, , 3]);
                                                    return [4 /*yield*/, pool.query("INSERT INTO ch_events (name, description, moderators, scheduled_for, link) VALUES ($1, $2, $3, $4, $5) RETURNING *", [nameRoom, descRoom, withRoom, dateRoom, linkRoom])];
                                                case 1:
                                                    result = _b.sent();
                                                    console.log("Event " + linkRoom + " added with ID: " + result.rows[0].ID);
                                                    return [3 /*break*/, 3];
                                                case 2:
                                                    error_1 = _b.sent();
                                                    console.error(error_1);
                                                    return [3 /*break*/, 3];
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    });
                                });
                            }
                            return [2 /*return*/];
                        });
                    });
                });
                stream.on("error", function (error) {
                    console.log(error);
                });
            });
            return [2 /*return*/];
        });
    });
}
var parseRoomInfo = function (body) {
    var rexp = /content="(.*?)"/gi;
    var new_data = matchAll(body, rexp).toArray();
    var nameRoom = new_data[3];
    var fullDescRoom = new_data[4];
    var linkRoom = new_data[7];
    var step_1 = fullDescRoom.match("(.*?).with");
    var step_2 = step_1[1].replace(",", "");
    var dateRoom = step_2.replace("at ", "").replace("am", " am").replace("pm", " pm");
    var withRoom = fullDescRoom.substring(fullDescRoom.indexOf("with") + 5, fullDescRoom.indexOf("."));
    var descRoom = fullDescRoom.substring(fullDescRoom.indexOf(".") + 2);
    return {
        nameRoom: nameRoom,
        withRoom: withRoom,
        descRoom: descRoom,
        dateRoom: new Date(Date.parse(dateRoom)),
        linkRoom: linkRoom
    };
};
var fetchContent = function (url, onComplete) {
    fetch(url, { static: true })
        .then(function (response) { return response.text(); })
        .then(function (text) { return onComplete(parseRoomInfo(text)); });
};
main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
