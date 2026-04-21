const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: 'Too many requests from this IP, please try again in 15 minutes',
  validate: { ip: false },
})

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message:
    'Too many accounts created from this IP, please try again in an hour',
  validate: { ip: false },
})

module.exports = {
  limiter,
  registrationLimiter,
}
