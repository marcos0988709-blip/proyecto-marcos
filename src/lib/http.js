export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const assert = (cond, status, message, details) => {
  if (!cond) throw new HttpError(status, message, details);
};
