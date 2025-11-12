import { useState, useEffect } from 'react';

export function useConversation(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [sessionId]);

  const sendMessage = async (content: string) => {
    console.log('Sending message:', content);
  };

  return {
    messages,
    session,
    loading,
    sendMessage,
  };
}
