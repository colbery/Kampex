class ExpressBlad extends Error {
  constructor(message, statusCode) {
    super();
    this.message = message;
    this.statusCode = statusCode;
  }
}
module.exports = ExpressBlad;
