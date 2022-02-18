const fs = require("fs");
const path = require("path");

const getPath = file => path.resolve(__dirname, file);

const baseMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV2BasicMapping.json"))
);

const eventNameMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV2EventNameMapping.json"))
);

const eventPropsMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV2EventPropsMapping.json"))
);

const eventPropsToPathMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV2EventPropPathMapping.json"))
);

const eventPropToTypeMapping = JSON.parse(
  fs.readFileSync(getPath("./data/TrackityV2EventPropToTypeMapping.json"))
);

module.exports = {
  baseMapping,
  eventNameMapping,
  eventPropsMapping,
  eventPropsToPathMapping,
  eventPropToTypeMapping
};
