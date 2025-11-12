import { useState, useEffect } from 'react';

export function usePresence(sessionId: string) {
  const [onlineAgents, setOnlineAgents] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);

  useEffect(() => {
  }, [sessionId]);

  return {
    onlineAgents,
    typing,
  };
}
