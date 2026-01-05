function notFound(req, res, next) {
  res.status(404).json({ ok: false, error: "Route not found" });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  // Avoid leaking sensitive internals in prod
  const payload = {
    ok: false,
    error: err.message || "Server error",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
