const fs = require("fs");
const path = require("path");

const getPath = file => path.resolve(__dirname, file);

const baseMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityBasicMapping.json"))
);

const eventNameMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityEventNameMapping.json"))
);

const eventPropsMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityEventPropsMapping.json"))
);

const eventPropsToPathMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityEventPropPathMapping.json"))
);

const eventPropToTypeMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityEventPropToTypeMapping.json"))
);

module.exports = {
  baseMapping,
  eventNameMapping,
  eventPropsMapping,
  eventPropsToPathMapping,
  eventPropToTypeMapping
};
