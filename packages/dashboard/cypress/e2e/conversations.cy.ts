describe('Conversations', () => {
  beforeEach(() => {
    cy.visit('/conversations');
  });

  it('should display conversations list', () => {
    cy.contains('Conversations').should('be.visible');
  });

  it('should navigate to conversation detail', () => {
    cy.visit('/conversations/test-session-id');
    cy.contains('Conversation test-session-id').should('be.visible');
  });

  it('should send a message', () => {
    cy.visit('/conversations/test-session-id');
    cy.get('input[placeholder="Type a message..."]').type('Hello{enter}');
  });
});
