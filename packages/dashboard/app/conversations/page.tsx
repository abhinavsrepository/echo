'use client';

import { useState, useEffect } from 'react';

export default function ConversationsPage() {
  const [sessions, setSessions] = useState([]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Conversations</h1>
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground">No active conversations</p>
        ) : (
          sessions.map((session: any) => (
            <div key={session.id} className="p-4 border rounded-lg">
              <p>Session {session.id}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
