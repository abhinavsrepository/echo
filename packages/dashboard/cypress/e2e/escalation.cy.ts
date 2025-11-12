describe('Escalation', () => {
  beforeEach(() => {
    cy.visit('/conversations/test-session-id');
  });

  it('should show escalate button', () => {
    cy.contains('Escalate').should('be.visible');
  });

  it('should escalate conversation', () => {
    cy.contains('Escalate').click();
  });
});
