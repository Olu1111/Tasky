function notFound(req, res, next) {
  res.status(404).json({ ok: false, error: "Route not found" });
}

function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === "production";
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Server error";
  
  // Log all errors
  const logLevel = status >= 500 ? "error" : "warn";
  console.log(`[${logLevel.toUpperCase()}] ${status} - ${message}`);
  if (!isProduction) {
    console.error(err.stack);
  }

  // Avoid leaking sensitive internals in production
  const payload = {
    ok: false,
    error: isProduction && status === 500 ? "Internal Server Error" : message,
  };

  if (!isProduction) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
