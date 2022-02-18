/* eslint-disable no-nested-ternary */
const get = require("get-value");
const set = require("set-value");
const {
  formatTimeStamp
} = require("../../util");

function updateEventName(message, dest, mapping) {
  const mappedEventName = mapping[message.event] || message.event;
  set(dest, "action_name", mappedEventName);
}

function updateOSName(message, dest) {
  if (message.channel === "mobile") {
    const name = get(message, "context.os.name") || "";
    const version = get(message, "context.os.version") || "";
    const osName = `${version} ${name}`;

    set(dest, "os_name", osName);
  }
}

function updateCreatedAt(message, dest) {
  const ts = get(message, "originalTimestamp") || "";
  const createdAt = formatTimeStamp(ts);
  set(dest, "created_at", createdAt);
}

module.exports = {
  updateEventName,
  updateOSName,
  updateCreatedAt
};
