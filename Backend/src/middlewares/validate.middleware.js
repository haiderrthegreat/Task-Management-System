const { ZodError } = require("zod");
const { sendError } = require("../utils/response");

/**
 * Middleware factory — validates req.body against a Zod schema.
 * Attaches the parsed data to req.validatedData on success.
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validatedData = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return sendError(res, 422, "Validation failed", formattedErrors);
      }
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return sendError(res, 422, "Validation failed", formattedErrors);
      }
      next(error);
    }
  };
};

module.exports = { validate, validateQuery };