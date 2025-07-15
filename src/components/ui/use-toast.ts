export function toast({ title, description, variant = "default" }: {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}) {
  // Simple toast implementation
  console.log(`[Toast - ${variant}] ${title ? title + ': ' : ''}${description}`);
  
  // In a real app, this would show a toast notification using a UI library
  // For now we're just providing a simple implementation
}
