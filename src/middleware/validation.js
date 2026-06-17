const Joi = require('joi');

// returns middleware that validates req.body against a Joi schema
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (result.error) {
            const details = result.error.details.map((d) => ({ path: d.path.join('.'), message: d.message }));
            return res.status(400).json({ error: { message: 'Validation failed', details } });
        }
        req.body = result.value;
        next();
    };
}

// returns middleware that validates req.params against a Joi schema
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.validate(req.params, { abortEarly: false, stripUnknown: true });
        if (result.error) {
            const details = result.error.details.map((d) => ({ path: d.path.join('.'), message: d.message }));
            return res.status(400).json({ error: { message: 'Validation failed', details } });
        }
        req.params = result.value;
        next();
    };
}

module.exports = { validateBody, validateParams, Joi };
