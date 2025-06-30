
import { Badge } from "@/components/ui/badge";

interface DockerStatusBadgeProps {
  status: 'running' | 'stopped' | 'warning';
}

export const DockerStatusBadge = ({ status }: DockerStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          variant: 'default' as const,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
          label: 'Running'
        };
      case 'stopped':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
          label: 'Stopped'
        };
      case 'warning':
        return {
          variant: 'destructive' as const,
          className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
          label: 'Warning'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} font-medium text-xs px-2 py-1`}
    >
      {config.label}
    </Badge>
  );
};