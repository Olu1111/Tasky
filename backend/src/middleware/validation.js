// Input validation middleware to prevent common security issues

function validateEmail(email) {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove any potential script tags or HTML
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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

  // Password strength check
  if (password.length < 6) {
    return res.status(400).json({ 
      ok: false, 
      error: "Password must be at least 6 characters long" 
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
