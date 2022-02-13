const get = require("get-value");
const set = require("set-value");
// const sha256 = require("sha256");
const { EventType } = require("../../../constants");
const {
  removeUndefinedValues,
  // getDateInFormat,
  formatTimeStamp,
  defaultRequestConfig,
  defaultPostRequestConfig,
  getValueFromMessage,
  getSuccessRespEvents,
  getErrorRespEvents,
  CustomError,
  // isAppleFamily
} = require("../../util");

const {
  baseMapping,
  eventNameMapping,
  eventPropsMapping,
  eventPropsToPathMapping,
  eventPropToTypeMapping
} = require("./config");
const logger = require("../../../logger");
const { unset } = require("lodash");

const extInfoArray = ["", "", 0, 0, "", "", "", "", "", 0, 0, 0.0, 0, 0, 0];

function getCorrectedTypedValue(pathToKey, value, originalPath) {
  const type = eventPropToTypeMapping[pathToKey];
  // TODO: we should remove this eslint rule or comeup with a better way
  if (typeof value === type) {
    return value;
  }

  throw new CustomError(
    `${
      typeof originalPath === "object"
        ? JSON.stringify(originalPath)
        : originalPath
    } is not of valid type`,
    400
  );
}

function processEventTypeGeneric(message, baseEvent, fbEventName) {
  // let updatedEvent = message;
  let updatedEvent = {
    ...baseEvent
  };
  // set(updatedEvent.custom_events[0], "_eventName", fbEventName);

  const { properties } = message;
  if (properties) {
    unset(
      updatedEvent,
      "properties"
    )

    let processedKey;
    Object.keys(properties).forEach(k => {
      processedKey = k;
      // if (!eventAndPropRegex.test(k)) {
      //   // replace all non alphanumeric characters with ''
      //   processedKey = processedKey.replace(/[^0-9a-z _-]/gi, "");
      //   if (k.length > 40) {
      //     // trim key if length is greater than 40
      //     processedKey = k.substring(0, 40);
      //   }
      //   if (processedKey.length === 0) {
      //     throw new CustomError(
      //       `The property key ${k} has only non-alphanumeric characters.A property key must be an alphanumeric string and have atmost 40 characters.`,
      //       400
      //     );
      //   }
      // }
      if (eventPropsToPathMapping[k]) {
        let rudderEventPath = eventPropsToPathMapping[k];
        let fbEventPath = eventPropsMapping[rudderEventPath];

        // if (rudderEventPath.indexOf("sub") > -1) {
        //   const [prefixSlice, suffixSlice] = rudderEventPath.split(".sub.");
        //   const parentArray = get(message, prefixSlice);
        //   updatedEvent.custom_events[0][fbEventPath] = [];

        //   let length = 0;
        //   let count = parentArray.length;
        //   while (count > 0) {
        //     const intendValue = get(parentArray[length], suffixSlice);
        //     updatedEvent.custom_events[0][fbEventPath][length] =
        //       getCorrectedTypedValue(
        //         fbEventPath,
        //         intendValue,
        //         parentArray[length]
        //       ) || "";

        //     length += 1;
        //     count -= 1;
        //   }
        // } else {
          // rudderEventPath = eventPropsToPathMapping[k];
          // fbEventPath = eventPropsMapping[rudderEventPath];
          const intendValue = get(message, rudderEventPath);
          set(
            updatedEvent,//updatedEvent.custom_events[0],
            fbEventPath,
            getCorrectedTypedValue(fbEventPath, intendValue, rudderEventPath) ||
              ""
          );
        // }
      } else {
        set(
          updatedEvent,//updatedEvent.custom_events[0], 
          processedKey, 
          properties[k]
        );
      }
    });
  }
  return updatedEvent;
}

function responseBuilderSimple(message, payload, destination) {
  const { endpoint, accessKey } = destination.Config;

  const response = defaultRequestConfig();
  response.endpoint = endpoint;
  response.method = defaultPostRequestConfig.requestMethod;
  response.headers = {
    "Authorization": accessKey,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  response.userId = message.userId ? message.userId : message.anonymousId;
  // response.body.JSON = {
  //   "event_uni_key": "1644469846081_89B2A460-8CFF-4F6D-887F-97640115B416",
  //   "device_token": "f7f7V_3MeU1SkJKKTUzVdl:APA91bFe_w9IjtjpX_B2EpO7nyIkIMdlPu0bkdjQl2cJiHZqhF0kw1DMFHPTWEhriv8cKFKKuxr2yeBI6riNxtnZ1CfQ18XlhBysgfwj0wiWumOrxMqpK5ROndLNvQibO9-kYgbsdvtr",
  //   "device_idfv": "mobi_9d71a578-1976-4403-bada-0bda54416da9",
  //   "device_type": "iPhone",
  //   "device_idfa": "00000000-0000-0000-0000-000000000000",
  //   "os_name": "15.2 ios",
  //   "app_version": "4.91.0",
  //   "created_at": 1644469858740.0837,
  //   "device_manufacturer": "Apple",
  //   "bundle_identifier": "vn.tiki.app.Tiki",
  //   "client_id": "9d71a578-1976-4403-bada-0bda54416da9",
  //   "app_name": "TikiProject",
  //   "tkt_sdk_version": "2.4.8",
  //   "app_build_version": "4.91.0",
  //   "action_name": "register"
  // };
  response.body.JSON = removeUndefinedValues(payload);
  response.statusCode = 200;

  return response;
}

function buildBaseEvent(message) {
  const baseEvent = message;//{};

  // khanh.vo: setup `os_name`
  const name = get(message, "context.os.name") || "";
  const version = get(message, "context.os.version") || "";
  const osName = `${name} ${version}`;
  
  set(
    baseEvent,
    "os_name",
    osName
  );
  
  // khanh.vo: setup `created_at`
  const ts = get(message, "originalTimestamp") || "";
  const createdAt = formatTimeStamp(ts);
  set(
    baseEvent,
    "created_at",
    createdAt
  );

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

  return baseEvent;
}

function processSingleMessage(message, destination) {
  let fbEventName;
  const baseEvent = buildBaseEvent(message);
  const eventName = message.event;
  let updatedEvent = {};
  logger.info(`__DEBUG__ trackity event name: ${eventName}`);
  logger.info(`__DEBUG__ trackity message: ${JSON.stringify(message)}`);

  fbEventName = eventNameMapping[eventName] || eventName;
  updatedEvent = processEventTypeGeneric(message, baseEvent, fbEventName);
  logger.info(`__DEBUG__ trackity updatedEvent: ${JSON.stringify(removeUndefinedValues(updatedEvent))}`);

  // switch (message.type) {
  //   case EventType.TRACK:
  //     fbEventName = eventNameMapping[eventName] || eventName;
  //     if (!eventAndPropRegex.test(fbEventName)) {
  //       throw new CustomError(
  //         `Event name ${fbEventName} is not a valid FB APP event name.It must match the regex ${eventAndPropRegexPattern}.`,
  //         400
  //       );
  //     }
  //     updatedEvent = processEventTypeGeneric(message, baseEvent, fbEventName);
  //     break;
  //   case EventType.SCREEN: {
  //     const { name } = message.properties;
  //     if (!name || !eventAndPropRegex.test(name)) {
  //       // TODO : log if name does not match regex
  //       fbEventName = "Viewed Screen";
  //     } else {
  //       fbEventName = `Viewed ${name} Screen`;
  //       if (!eventAndPropRegex.test(fbEventName)) {
  //         throw new CustomError(
  //           `Event name ${fbEventName} is not a valid FB APP event name.It must match the regex ${eventAndPropRegexPattern}.`,
  //           400
  //         );
  //       }
  //     }
  //     updatedEvent = processEventTypeGeneric(message, baseEvent, fbEventName);
  //     break;
  //   }
  //   case EventType.PAGE:
  //     fbEventName = "Viewed Page";
  //     updatedEvent = processEventTypeGeneric(message, baseEvent, fbEventName);
  //     break;
  //   default:
  //     logger.error("could not determine type");
  //     throw new CustomError("message type not supported", 400);
  // }

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
