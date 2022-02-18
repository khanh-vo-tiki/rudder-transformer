const fs = require("fs");
const path = require("path");

const getPath = file => path.resolve(__dirname, file);

const baseMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV1BasicMapping.json"))
);

const eventNameMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV1EventNameMapping.json"))
);

const eventPropsMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV1EventPropsMapping.json"))
);

const eventPropsToPathMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV1EventPropPathMapping.json"))
);

const eventPropToTypeMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV1EventPropToTypeMapping.json"))
);

module.exports = {
  baseMapping,
  eventNameMapping,
  eventPropsMapping,
  eventPropsToPathMapping,
  eventPropToTypeMapping
};
