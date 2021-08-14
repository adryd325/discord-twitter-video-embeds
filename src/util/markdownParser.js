const SimpleMarkdown = require("simple-markdown");

let currentOrder = 0;

const rules = {
  escape: {
    order: (currentOrder += 1),
    match: (source) => /^\\([^0-9A-Za-z\s])/.exec(source),
    parse: (capture) => ({
      type: "text",
      content: capture[1]
    })
  },
  codeBlock: {
    order: (currentOrder += 1),
    match: (source) => /^```(?:([a-z0-9_+\-.]+?)\n)?\n*([^\n][^]*?)\n*```/i.exec(source),
    parse: (capture) => ({
      content: capture[2]
    })
  },
  inlineCode: {
    order: (currentOrder += 1),
    match: (source) => /^(`+)([\s\S]*?[^`])\1(?!`)/i.exec(source),
    parse: (capture) => ({
      content: capture[2]
    })
  },
  spoiler: {
    order: (currentOrder += 1),
    match: (source) => /^\|\|([\s\S]+?)\|\|/.exec(source),
    parse: (capture, parse, state) => ({
      content: parse(capture[1], state)
    })
  },
  embedPrevention: {
    order: (currentOrder += 1),
    match: (source) => /^<([\S]+?)>/.exec(source),
    parse: (capture) => ({
      content: capture[1]
    })
  },
  url: {
    order: (currentOrder += 1),
    match: (source) => /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/.exec(source),
    parse: (capture) => ({
      content: capture[1]
    })
  },
  text: {
    order: (currentOrder += 1),
    match: (source) => /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff]|\n\n| {2,}\n|\w+:\S|$)/.exec(source),
    parse: (capture) => ({
      content: capture[0]
    })
  }
};

const parser = SimpleMarkdown.parserFor(rules);

module.exports = function parse(source) {
  return parser(source, { inline: false });
};
