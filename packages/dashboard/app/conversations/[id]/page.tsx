'use client';

import { useParams } from 'next/navigation';
import { ChatPanel } from '@/components/ChatPanel';

export default function ConversationPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Conversation {id}</h1>
      </header>
      <ChatPanel sessionId={id} />
    </div>
  );
}
