interface EscalateButtonProps {
  sessionId: string;
}

export function EscalateButton({ sessionId }: EscalateButtonProps) {
  const handleEscalate = () => {
    console.log('Escalating session:', sessionId);
  };

  return (
    <button
      onClick={handleEscalate}
      className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground"
    >
      Escalate
    </button>
  );
}
