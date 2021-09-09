/* eslint-disable no-console */
const {
  defaultRequestConfig,
  defaultPostRequestConfig
} = require("../../util");

const responseWrapper = response => {
  const resp = defaultRequestConfig();
  resp.endpoint = response.endPoint;
  resp.method = defaultPostRequestConfig.requestMethod;
  resp.headers = { ...response.headers, "Content-Type": "application/json" };
  resp.body.JSON = response.payload;
  return resp;
};

function process(event) {
  const { message } = event;
  const { properties } = message;
  const {
    destination: {
      Config: { datasetId, tableId }
    }
  } = event;

  const payload = {
    rows: [
      {
        json: { ...properties }
      }
    ]
  };
  return responseWrapper({
    payload,
    method: "POST",
    // TODO: ProjectID(rudder-sai) can be referred in a more customised way!
    endPoint: `https://bigquery.googleapis.com/bigquery/v2/projects/rudder-sai/datasets/${datasetId}/tables/${tableId}/insertAll`
    // endPoint: `https://bigquery.googleapis.com/bigquery/v2/projects/rudderstack-dev/datasets/${datasetId}/tables/${tableId}/insertAll`
  });
}

/**
 * This function puts the accessToken information in the transformed response
 * to facilitate for a successfully authorised event
 *
 * @param {*} AccountCache - Instance of node-cache to get the access token information
 * @param {*} event - The event on which transformation is being performed
 * @param {*} response - Transformation Response
 * @returns Transformation Response bound with token information(may not be required as such)
 */
async function processAuth(AccountCache, event, response) {
  // OAuth for BQStream destination
  const { workspaceId } = event.metadata;
  const { accountId } = event.destination.Config;
  const oAuthToken = await AccountCache.getTokenFromCache(
    workspaceId,
    accountId
  );
  response.headers.Authorization = `Bearer ${oAuthToken}`;
  return response;
}

module.exports = { process, processAuth };
