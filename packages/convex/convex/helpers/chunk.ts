import { LIMITS } from '@echo/shared/constants';

export interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startIndex: number;
    endIndex: number;
  };
}

export function chunkText(
  text: string,
  chunkSize: number = LIMITS.CHUNK_SIZE,
  overlap: number = LIMITS.CHUNK_OVERLAP
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sentences = splitIntoSentences(text);

  let currentChunk = '';
  let startIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunks.length,
            totalChunks: 0,
            startIndex,
            endIndex: startIndex + currentChunk.length,
          },
        });
      }

      startIndex += currentChunk.length - overlap;
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunkIndex: chunks.length,
        totalChunks: 0,
        startIndex,
        endIndex: startIndex + currentChunk.length,
      },
    });
  }

  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

function splitIntoSentences(text: string): string[] {
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];
  return sentences.map((s) => s.trim());
}

export function extractTextFromMarkdown(markdown: string): string {
  let text = markdown;

  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  text = text.replace(/~~(.+?)~~/g, '$1');
  text = text.replace(/`(.+?)`/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^\s*>\s+/gm, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
