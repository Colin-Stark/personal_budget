function errorHandler(err, req, res, _next) {
    /* eslint-disable no-console */
    console.error(err);
    const status = err.status || 500;
    const payload = { error: { message: err.message || 'Internal Server Error' } };
    if (process.env.NODE_ENV !== 'production' && err.stack) payload.error.stack = err.stack;
    res.status(status).json(payload);
}

module.exports = errorHandler;
