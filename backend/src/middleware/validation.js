// Input validation middleware to prevent common security issues

function validateEmail(email) {
  // More robust email validation
  // Based on HTML5 email input validation pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Basic sanitization - remove common XSS patterns
  // Note: For production, consider using a library like validator.js or DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
}

// Validate registration input
function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required fields: name, email, password" 
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Invalid email format" 
    });
  }

  // Password strength check - minimum 8 characters recommended
  if (password.length < 8) {
    return res.status(400).json({ 
      ok: false, 
      error: "Password must be at least 8 characters long" 
    });
  }

  // Sanitize name input
  req.body.name = sanitizeInput(name);
  req.body.email = email.toLowerCase().trim();

  next();
}

// Validate login input
function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required fields: email, password" 
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Invalid email format" 
    });
  }

  // Normalize email
  req.body.email = email.toLowerCase().trim();

  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  sanitizeInput,
};
