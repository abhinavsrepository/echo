import React, { useState, useEffect, useRef } from 'react';
import type { WidgetConfig } from '@echo/shared/types';
import { EchoAPI } from './api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface EchoWidgetProps extends WidgetConfig {
  convexUrl: string;
}

export const EchoWidget: React.FC<EchoWidgetProps> = ({
  convexUrl,
  tenantId,
  theme = 'light',
  primaryColor = '#4F46E5',
  brandName = 'Echo Support',
  welcomeMessage = 'Hi! How can we help you today?',
  placeholder = 'Type your message...',
  showBranding = true,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const apiRef = useRef<EchoAPI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = new EchoAPI({ tenantId, theme, primaryColor, brandName });
    apiRef.current = api;

    api.connect(convexUrl).then(() => {
      setIsConnected(true);
    });

    api.on('message', (data) => {
      const message = data as Message;
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    });

    api.on('typing', (data) => {
      setIsTyping(data as boolean);
    });

    return () => {
      api.disconnect();
    };
  }, [convexUrl, tenantId, theme, primaryColor, brandName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (): void => {
    if (!input.trim() || !apiRef.current) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    apiRef.current.send({
      type: 'message',
      payload: { content: input },
      timestamp: Date.now(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      padding: '16px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      backgroundColor: primaryColor,
      color: '#FFFFFF',
    },
    brandName: {
      fontSize: '18px',
      fontWeight: 600,
      margin: 0,
    },
    statusIndicator: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: isConnected ? '#10B981' : '#EF4444',
      marginRight: '8px',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    message: (isUser: boolean) => ({
      maxWidth: '80%',
      padding: '12px 16px',
      borderRadius: '12px',
      alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
      backgroundColor: isUser ? primaryColor : (isDark ? '#374151' : '#F3F4F6'),
      color: isUser ? '#FFFFFF' : (isDark ? '#F9FAFB' : '#111827'),
      wordWrap: 'break-word' as const,
    }),
    inputContainer: {
      padding: '16px',
      borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      display: 'flex',
      gap: '8px',
    },
    input: {
      flex: 1,
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: '14px',
      outline: 'none',
    },
    sendButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: primaryColor,
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
    },
    typingIndicator: {
      alignSelf: 'flex-start',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      color: isDark ? '#F9FAFB' : '#6B7280',
    },
    branding: {
      fontSize: '12px',
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center' as const,
      padding: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.brandName}>
          <span style={styles.statusIndicator} />
          {brandName}
        </h3>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.message(false)}>
            {welcomeMessage}
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} style={styles.message(message.role === 'user')}>
            {message.content}
          </div>
        ))}
        {isTyping && (
          <div style={styles.typingIndicator}>
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          style={styles.input}
          disabled={!isConnected}
        />
        <button
          onClick={handleSend}
          style={styles.sendButton}
          disabled={!input.trim() || !isConnected}
        >
          Send
        </button>
      </div>

      {showBranding && (
        <div style={styles.branding}>
          Powered by Echo
        </div>
      )}
    </div>
  );
};
