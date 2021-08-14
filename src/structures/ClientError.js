class ClientError extends Error {
  constructor(message, provider) {
    super(message);
    this.provider = provider;
  }
}

module.exports = ClientError;
