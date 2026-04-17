const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again later',
  validate: { ip: false },
})

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // limit each IP to 10 registration attempts per hour
  message:
    'Too many accounts created from this IP, please try again in an hour',
  validate: { ip: false },
})

module.exports = {
  limiter,
  registrationLimiter,
}
