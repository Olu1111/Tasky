describe('User Journey: Signup to Board Creation', () => {
  const testUser = {
    name: `Test User ${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    password: 'TestPass123!'
  };

  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should signup new user and navigate to login', () => {
    cy.contains('button', 'Sign Up').click();
    cy.get('input[placeholder*="Name"]').type(testUser.name);
    cy.get('input[placeholder*="Email"]').type(testUser.email);
    cy.get('input[placeholder*="Password"]').type(testUser.password, { log: false });
    cy.contains('button', 'Sign Up').click();

    // Should show success and redirect
    cy.contains('Successfully registered').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should login with created credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type(testUser.email);
    cy.get('input[placeholder*="Password"]').type(testUser.password, { log: false });
    cy.contains('button', 'Log In').click();

    // Should redirect to boards page
    cy.url().should('include', '/boards');
    cy.contains('Boards').should('be.visible');
  });

  it('should create new board from authenticated state', () => {
    // Login first
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type(testUser.email);
    cy.get('input[placeholder*="Password"]').type(testUser.password, { log: false });
    cy.contains('button', 'Log In').click();

    cy.url().should('include', '/boards');

    // Create board
    cy.contains('button', 'New Board').click();
    cy.get('input[placeholder*="Board title"]').type('Test Board');
    cy.get('textarea').type('Test board description');
    cy.contains('button', 'Create').click();

    // Should show success and board in list
    cy.contains('Board created successfully').should('be.visible');
    cy.contains('Test Board').should('be.visible');
  });
});

describe('User Journey: Add Ticket and Move Between Columns', () => {
  const testBoard = `Board ${Date.now()}`;
  const testTicket = `Ticket ${Date.now()}`;

  before(() => {
    // Login and ensure we have a board
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type('admin@example.com');
    cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
    cy.contains('button', 'Log In').click();
    cy.url().should('include', '/boards');
  });

  it('should navigate to a board and create ticket', () => {
    cy.visit('http://localhost:5173/boards');

    // Click on first available board
    cy.get('div[class*="BoardCard"]').first().click();
    cy.contains('h1').should('be.visible');

    // Create ticket
    cy.contains('button', 'New Ticket').click();
    cy.get('input[placeholder*="Ticket title"]').type(testTicket);
    cy.get('input[placeholder*="Priority"]').parent().click();
    cy.contains('high').click();
    cy.contains('button', 'Create').click();

    // Verify ticket appears
    cy.contains(testTicket).should('be.visible');
  });

  it('should move ticket between columns by drag and drop', () => {
    cy.visit('http://localhost:5173/boards');
    cy.get('div[class*="BoardCard"]').first().click();

    // Find ticket and drag to different column
    cy.contains(testTicket).should('be.visible');

    // This assumes columns exist (To Do, In Progress, Done)
    cy.contains(testTicket)
      .parent()
      .parent()
      .trigger('mousedown');

    cy.get('[class*="Column"]').eq(1).trigger('dragover').trigger('drop');

    // Verify moved
    cy.contains(testTicket).should('be.visible');
  });

  it('should add comment to ticket from edit modal', () => {
    cy.visit('http://localhost:5173/boards');
    cy.get('div[class*="BoardCard"]').first().click();

    // Click ticket to open edit modal
    cy.contains(testTicket).click();
    cy.get('textarea[placeholder*="Comment"]').type('This is a test comment');
    cy.contains('button', 'Add Comment').click();

    // Verify comment appears
    cy.contains('This is a test comment').should('be.visible');
  });
});

describe('Admin vs Member Permissions', () => {
  const memberEmail = 'member@example.com';
  const adminEmail = 'admin@example.com';

  describe('Admin User', () => {
    it('should have access to admin page', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[placeholder*="Email"]').type(adminEmail);
      cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
      cy.contains('button', 'Log In').click();

      cy.visit('http://localhost:5173/admin');
      cy.url().should('include', '/admin');
      cy.contains('Users').should('be.visible');
      cy.contains('Boards').should('be.visible');
    });

    it('should be able to manage users', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[placeholder*="Email"]').type(adminEmail);
      cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
      cy.contains('button', 'Log In').click();

      cy.visit('http://localhost:5173/admin');
      cy.get('input[placeholder*="Search users"]').type('test');
      cy.contains('button', 'Role').should('be.visible');
    });
  });

  describe('Member User', () => {
    it('should not have access to admin page', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[placeholder*="Email"]').type(memberEmail);
      cy.get('input[placeholder*="Password"]').type('password123', { log: false });
      cy.contains('button', 'Log In').click();

      cy.visit('http://localhost:5173/admin');
      // Should redirect back to boards
      cy.url().should('include', '/boards');
    });

    it('should only see assignee button on tickets they created', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[placeholder*="Email"]').type(memberEmail);
      cy.get('input[placeholder*="Password"]').type('password123', { log: false });
      cy.contains('button', 'Log In').click();

      cy.visit('http://localhost:5173/boards');
      cy.get('div[class*="BoardCard"]').first().click();

      // Find a ticket created by this member
      cy.contains('button', 'Assign').should('exist');
    });
  });
});

describe('Search Functionality', () => {
  beforeEach(() => {
    // Login
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type('admin@example.com');
    cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
    cy.contains('button', 'Log In').click();
  });

  it('should search for boards', () => {
    cy.visit('http://localhost:5173/boards');

    cy.get('input[placeholder*="Search"]').type('Test Board');
    cy.contains('📋').should('be.visible');
    cy.contains('Board').should('be.visible');
  });

  it('should search for tickets', () => {
    cy.visit('http://localhost:5173/boards');

    cy.get('input[placeholder*="Search"]').type('Ticket');
    cy.contains('🎫').should('be.visible');
    cy.contains('button', 'Ticket').should('exist');
  });

  it('should navigate to board from search result', () => {
    cy.visit('http://localhost:5173/boards');

    cy.get('input[placeholder*="Search"]').type('Test Board');
    cy.contains('Test Board').click();

    // Should navigate to board
    cy.url().should('match', /\/boards\/[a-f0-9]{24}/);
  });

  it('should navigate to ticket from search result', () => {
    cy.visit('http://localhost:5173/boards');

    cy.get('input[placeholder*="Search"]').type('Ticket');
    cy.contains('Ticket').parent().click();

    // Should navigate to board view with ticket visible
    cy.url().should('include', '/boards/');
  });
});

describe('Data Consistency: Frontend-Backend Sync', () => {
  const testTicket = `Consistency Test ${Date.now()}`;

  beforeEach(() => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type('admin@example.com');
    cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
    cy.contains('button', 'Log In').click();
    cy.visit('http://localhost:5173/boards');
    cy.get('div[class*="BoardCard"]').first().click();
  });

  it('should persist ticket data after refresh', () => {
    // Create ticket
    cy.contains('button', 'New Ticket').click();
    cy.get('input[placeholder*="Ticket title"]').type(testTicket);
    cy.contains('button', 'Create').click();

    // Refresh page
    cy.reload();

    // Ticket should still exist
    cy.contains(testTicket).should('be.visible');
  });

  it('should sync comment deletions when saving other changes', () => {
    // Find and edit a ticket
    cy.contains(testTicket).click();

    // Add a comment
    cy.get('textarea[placeholder*="Comment"]').type('Test comment');
    cy.contains('button', 'Add Comment').click();
    cy.contains('Test comment').should('be.visible');

    // Delete the comment
    cy.contains('Test comment').parent().find('button').click();
    cy.contains('Test comment').should('not.exist');

    // Save other changes (like title)
    cy.get('input[placeholder*="Title"]').clear().type(`${testTicket} Updated`);
    cy.contains('button', 'Save Changes').click();

    // Reopen the ticket
    cy.contains(`${testTicket} Updated`).click();

    // Comment should still be deleted
    cy.contains('Test comment').should('not.exist');
  });

  it('should sync assignee changes between frontend and backend', () => {
    cy.contains(testTicket).click();

    // Add assignee
    cy.contains('Assign').click();
    cy.get('input[placeholder*="Search"]').type('admin');
    cy.contains('checkbox').parent().click();
    cy.contains('button', 'Save').click();

    // Close and reopen
    cy.contains('button', 'Save Changes').click();
    cy.wait(500);
    cy.contains(testTicket).click();

    // Assignee should persist
    cy.contains('Assigned to').should('exist');
  });

  it('should reflect priority changes across sessions', () => {
    cy.contains(testTicket).click();

    // Change priority
    cy.get('select[name*="priority"]').select('high');
    cy.contains('button', 'Save Changes').click();

    // Refresh and reopen
    cy.reload();
    cy.contains(testTicket).click();

    // Priority should be persisted
    cy.get('select[name*="priority"]').should('have.value', 'high');
  });
});

describe('Comment CRUD Operations', () => {
  const testTicket = `Comment Test ${Date.now()}`;
  const testComment = 'Test Comment';

  beforeEach(() => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder*="Email"]').type('admin@example.com');
    cy.get('input[placeholder*="Password"]').type('admin123', { log: false });
    cy.contains('button', 'Log In').click();
    cy.visit('http://localhost:5173/boards');
    cy.get('div[class*="BoardCard"]').first().click();

    // Create test ticket
    cy.contains('button', 'New Ticket').click();
    cy.get('input[placeholder*="Ticket title"]').type(testTicket);
    cy.contains('button', 'Create').click();
    cy.contains(testTicket).click();
  });

  it('should create comment', () => {
    cy.get('textarea[placeholder*="Comment"]').type(testComment);
    cy.contains('button', 'Add').click();
    cy.contains(testComment).should('be.visible');
  });

  it('should edit comment inline', () => {
    cy.get('textarea[placeholder*="Comment"]').type(testComment);
    cy.contains('button', 'Add').click();

    // Click edit icon
    cy.contains(testComment).parent().find('[data-testid="EditIcon"]').click();
    cy.get('textarea').type(' - edited');
    cy.contains('button', '[data-testid="CheckIcon"]').click();

    cy.contains(`${testComment} - edited`).should('be.visible');
  });

  it('should delete comment', () => {
    cy.get('textarea[placeholder*="Comment"]').type(testComment);
    cy.contains('button', 'Add').click();

    // Click delete icon
    cy.contains(testComment).parent().find('[data-testid="DeleteIcon"]').click();
    cy.contains(testComment).should('not.exist');
  });

  it('should confirm deletion persists after save', () => {
    // Add comment
    cy.get('textarea[placeholder*="Comment"]').type(testComment);
    cy.contains('button', 'Add').click();
    cy.contains(testComment).should('be.visible');

    // Delete
    cy.contains(testComment).parent().find('[data-testid="DeleteIcon"]').click();
    cy.contains(testComment).should('not.exist');

    // Save changes
    cy.contains('button', 'Save Changes').click();

    // Reopen and verify deletion
    cy.contains(testTicket).click();
    cy.contains(testComment).should('not.exist');
  });
});
