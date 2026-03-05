class ExpressError extends Error {
    constructor(status, message){
        super();
        this.status = status;
        this.message = message;
    }
};

class NotFoundError extends ExpressError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

class BadRequestError extends ExpressError {
    constructor(message = "Bad Request") {
      super(400, message);
    }
  }
  class UnauthorizedError extends ExpressError {
    constructor(message = 'Unauthorized') {
      super(401, message); 
    }
  }
  
  class ForbiddenError extends ExpressError {
    constructor(message = 'Forbidden') {
      super(403, message); 
    }
  }
  
  module.exports = {
    ExpressError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
  };