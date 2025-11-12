export function VoiceBar() {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      <span className="text-sm font-medium">Voice call in progress</span>
    </div>
  );
}
