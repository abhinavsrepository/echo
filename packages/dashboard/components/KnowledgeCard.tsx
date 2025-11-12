interface KnowledgeCardProps {
  title: string;
  content: string;
  score: number;
}

export function KnowledgeCard({ title, content, score }: KnowledgeCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{(score * 100).toFixed(0)}% match</span>
      </div>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );
}
