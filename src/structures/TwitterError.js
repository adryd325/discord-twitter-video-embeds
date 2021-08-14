class TwitterError extends Error {
  constructor({ message, code }) {
    super(message);
    this.code = code;
  }
}

module.exports = TwitterError;
