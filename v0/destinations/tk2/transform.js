const get = require("get-value");
const set = require("set-value");
const {
  removeUndefinedValues,
  defaultRequestConfig,
  defaultPostRequestConfig,
  getValueFromMessage,
  getSuccessRespEvents,
  getErrorRespEvents,
  CustomError
} = require("../../util");
const {
  updateEventName,
  updateOSName,
  updateCreatedAt
} = require("./utils");

const {
  baseMapping,
  eventNameMapping,
  eventPropsMapping,
  eventPropsToPathMapping,
  eventPropToTypeMapping
} = require("./config");
const logger = require("../../../logger");

function getCorrectedTypedValue(pathToKey, value, originalPath) {
  const type = eventPropToTypeMapping[pathToKey];
  // TODO: we should remove this eslint rule or comeup with a better way
  if (typeof value === type) {
    return value;
  }

  throw new CustomError(
    `${typeof originalPath === "object"
      ? JSON.stringify(originalPath)
      : originalPath
    } is not of valid type`,
    400
  );
}

function processEventTypeGeneric(message, baseEvent) {
  let updatedEvent = {
    ...baseEvent
  };

  const { properties } = message;
  if (properties) {
    Object.keys(properties).forEach(k => {
      if (eventPropsToPathMapping[k]) {
        let rudderEventPath = eventPropsToPathMapping[k];
        let fbEventPath = eventPropsMapping[rudderEventPath];

        const intendValue = get(message, rudderEventPath);
        set(
          updatedEvent,
          fbEventPath,
          getCorrectedTypedValue(fbEventPath, intendValue, rudderEventPath) ||
          ""
        );
      }
    });
  }
  return updatedEvent;
}

function responseBuilderSimple(message, payload, destination) {
  const { 
    appName,
    endpoint,
    apiKey
  } = destination.Config;

  const response = defaultRequestConfig();
  response.endpoint = endpoint;
  response.method = defaultPostRequestConfig.requestMethod;
  response.headers = {
    "Authorization": apiKey,
    "User-Agent": appName,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  response.userId = message.userId ? message.userId : message.anonymousId;
  let updatedPayload = {
    ...removeUndefinedValues(payload),
    "tkt_sdk_version": "2.4.0"
  };
  logger.info(`__DEBUG__2 endpoint: ${endpoint}`);
  logger.info(`__DEBUG__2 \n\n ${JSON.stringify(updatedPayload)} \n\n`);
  response.body.JSON = updatedPayload;
  response.statusCode = 200;

  return response;
}

function buildBaseEvent(message) {
  const baseEvent = {};

  baseMapping.forEach(bm => {
    const { sourceKeys, destKey } = bm;
    const inputVal = getValueFromMessage(message, sourceKeys);
    if (inputVal) {
      set(
        baseEvent,
        destKey,
        inputVal || ""
      );
    }
  });

  updateEventName(message, baseEvent, eventNameMapping);
  updateOSName(message, baseEvent);
  updateCreatedAt(message, baseEvent);

  return baseEvent;
}

function processSingleMessage(message, destination) {
  const baseEvent = buildBaseEvent(message);
  let updatedEvent = processEventTypeGeneric(message, baseEvent);

  return responseBuilderSimple(message, updatedEvent, destination);
}

function process(event) {
  const resp = processSingleMessage(event.message, event.destination);
  if (!resp.statusCode) {
    resp.statusCode = 200;
  }
  return resp;
}

const processRouterDest = async inputs => {
  if (!Array.isArray(inputs) || inputs.length <= 0) {
    const respEvents = getErrorRespEvents(null, 400, "Invalid event array");
    return [respEvents];
  }

  const respList = await Promise.all(
    inputs.map(async input => {
      try {
        if (input.message.statusCode) {
          // already transformed event
          return getSuccessRespEvents(
            input.message,
            [input.metadata],
            input.destination
          );
        }
        // if not transformed
        return getSuccessRespEvents(
          await process(input),
          [input.metadata],
          input.destination
        );
      } catch (error) {
        return getErrorRespEvents(
          [input.metadata],
          error.response
            ? error.response.status
            : error.code
              ? error.code
              : 400,
          error.message || "Error occurred while processing payload."
        );
      }
    })
  );
  return respList;
};

module.exports = { process, processRouterDest };
