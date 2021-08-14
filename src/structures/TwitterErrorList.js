class TwitterErrorList extends Error {
  constructor(errors) {
    super(errors.map((err) => err.message).join("\n\n"));
    this.errors = errors;
  }
}

module.exports = TwitterErrorList;
