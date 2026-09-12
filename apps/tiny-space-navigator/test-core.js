"use strict";

const assert = require("node:assert/strict");
const { createMission, movePosition, evaluateMove, key } = require("./app.js");

const values = [0, .99, .1, .2, .3, .4, .5, .6, .7, .8, .9];
let index = 0;
const mission = createMission(() => values[index++ % values.length]);

assert.deepEqual(mission.start, { x: 0, y: 0 });
assert.deepEqual(mission.goal, { x: 4, y: 4 });
assert.equal(mission.rocks.length, 6);
assert.equal(new Set(mission.rocks.map(key)).size, 6, "隕石不可重疊");
assert.ok(!mission.rocks.some((rock) => rock.y === 0 || rock.x === 4), "保證路線不可放隕石");
assert.deepEqual(movePosition({ x: 0, y: 0 }, "left"), { x: 0, y: 0, moved: false });
assert.deepEqual(movePosition({ x: 2, y: 2 }, "up"), { x: 2, y: 1, moved: true });
assert.equal(evaluateMove(mission, mission.goal), "goal");
assert.equal(evaluateMove(mission, mission.rocks[0]), "rock");
assert.equal(evaluateMove(mission, mission.start), "safe");

console.log("tiny-space-navigator core tests: PASS");