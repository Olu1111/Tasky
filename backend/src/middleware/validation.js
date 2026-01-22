// Input validation middleware to prevent common security issues

function validateEmail(email) {
  // More robust email validation
  // Based on HTML5 email input validation pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function containsHtml(input) {
  if (typeof input !== 'string') return false;
  // Check for HTML tags and event handlers
  return /<[^>]*>/.test(input) || /on\w+\s*=/i.test(input);
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

  // Reject input containing HTML tags or scripts
  if (containsHtml(name)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Name cannot contain HTML tags" 
    });
  }

  // Password strength check - minimum 8 characters recommended
  if (password.length < 8) {
    return res.status(400).json({ 
      ok: false, 
      error: "Password must be at least 8 characters long" 
    });
  }

  // Normalize inputs (don't sanitize, just normalize)
  req.body.name = name.trim();
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
};
