const { getMappingConfig } = require("../../util");

const BASE_URL = "https://pi.pardot.com";

const endpoints = {
  createUrl: `${BASE_URL}/api/prospect/version/4/do/create`,
  updateUrl: `${BASE_URL}/api/prospect/version/4/do/update`,
  queryUrl: `${BASE_URL}/api/prospect/version/4/do/query?format=json`
};

const CONFIG_CATEGORIES = {
  IDENTIFY: {
    name: "PardotIdentify",
    endPointCreate: endpoints.createUrl,
    endPointUpdate: endpoints.updateUrl,
    endPointQuery: endpoints.queryUrl
  }
};

const MAPPING_CONFIG = getMappingConfig(CONFIG_CATEGORIES, __dirname);

module.exports = {
  BASE_URL,
  identifyConfig: MAPPING_CONFIG[CONFIG_CATEGORIES.IDENTIFY.name]
};
