const util = require("util");

var log = (exports = module.exports);

const escapeBrightOffset = 60;
const escapeTypes = {
  fg: 30,
  bg: 40
};
const escapeColors = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7
};

// Made this function cause I didn't want to type out 18 million variables
function makeColor(color, type) {
  let value = escapeTypes[type];
  if (color.startsWith("bright_")) {
    value += escapeBrightOffset;
    color = color.replace(/^bright_/, "");
  }
  value += escapeColors[color];
  return value;
}

function makeEscape(format) {
  if (!log.useColor) return "";
  if (!format) return "\x1b[0m";
  const modifiers = [];
  if (format.fg) modifiers.push(makeColor(format.fg, "fg"));
  if (format.bg) modifiers.push(makeColor(format.bg, "bg"));
  if (format.bold) modifiers.push(1);
  if (format.underline) modifiers.push(4);
  if (format.blink) modifiers.push(5);
  if (format.inverse) modifiers.push(7);
  if (modifiers.length !== 0) return "\x1b[" + modifiers.join(";") + "m";
  return "\x1b[0m";
}

// non blocking writes ty mary !!!
// awaitable so you can keep things in order if needed
function write(content, originalContent) {
  return new Promise((resolve) => {
    process.stderr.write(content, "utf8", () => {
      // return the original content so logs can be somewhat transparent with an await
      // not the most convinient thing but it works
      // eg. aFunctionYouCall(await log.raw(someDataYouDontKnow))
      resolve(originalContent);
    });
  });
}

function format(args, logType) {
  if (log.level > logType.level) return null;
  let content, prefix;
  // eg. log.level("hello");
  if (args.length === 1) {
    prefix = logType.formatted();
    content = args[0];
  }
  // eg. log.level("prefix", "hello!");
  else if (args.length > 1) {
    prefix = logType.formatted() + " " + args[0];
    if (log.useColor) {
      prefix = logType.formatted() + " " + makeEscape(log.prefixColor) + args[0] + makeEscape();
    }
    content = args[1];
  }
  // eg. log.level();
  else {
    prefix = logType.formatted();
    content = "";
  }

  // set our log string to not mutate content
  let logStr = content;

  // if we have an error, log the stacktrace
  if (typeof content === "object" && content instanceof Error && content.stack) {
    logStr = content.stack + "";
  }

  // if we have anything other than a string, use util.inspect
  // this formats output similarly to console.log
  if (typeof content !== "string") {
    logStr = util.inspect(content, false, 3, log.useColor);
  }

  // prepend the prefix to each line
  if (prefix !== "") {
    logStr = logStr
      .split("\n")
      .map((line) => prefix + " " + line)
      .join("\n");
  }

  return write(logStr + "\n", content);
}

log.format = format;

log.addLevel = function addLevel(name, level, format, displayName) {
  if (!displayName) displayName = name;
  log[name] = function logLevel(...args) {
    return log.format(args, log[name]);
  };
  log[name].level = level;

  log[name].formatted = () => {
    if (log.useColor) return makeEscape(format) + displayName + makeEscape();
    return displayName;
  };
};

// log with no level
log.raw = function raw(...args) {
  return format(args, { level: 10000, formatted: () => "" });
};

log.addLevel("silly", 500, { fg: "black", bg: "white" }, "sill");
log.addLevel("verbose", 1000, { fg: "blue", bg: "black" }, "verb");
log.addLevel("sql", 2000, { fg: "cyan" }, "sql!");
log.addLevel("info", 3000, { fg: "green" });
log.addLevel("warn", 4000, { fg: "black", bg: "yellow" }, "WARN");
log.addLevel("error", 5000, { fg: "red", bg: "black", bold: true }, "ERR!");

// @ts-ignore
log.level = 1000;
if (process.env.INSTANCE === "production") {
  // @ts-ignore
  log.level = 3000;
}
if (process.env.DEBUG) {
  // @ts-ignore
  log.level = 0;
}

log.useColor = true;
log.prefixColor = { fg: "magenta" };

module.exports = log;
