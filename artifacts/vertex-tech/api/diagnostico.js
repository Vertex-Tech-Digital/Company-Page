require("tsx/cjs");
const path = require("path");
const tsFile = path.join(__dirname, "diagnostico.ts");
delete require.cache[require.resolve(tsFile)];
module.exports = require(tsFile).default;
