import { ViewMode } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Grid3X3, LayoutGrid, List } from 'lucide-react';

interface NavigationProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
}

export const Navigation = ({ viewMode, onSetViewMode }: NavigationProps) => {
  return (
    <nav className="border-b border-border bg-card/50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <Grid3X3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight">BEATFORGE</h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Drum Machine
            </p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetViewMode('pads')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'pads' && 'active')}
          >
            <LayoutGrid className="w-4 h-4" />
            Pads
          </button>
          <button
            onClick={() => onSetViewMode('pattern')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'pattern' && 'active')}
          >
            <Grid3X3 className="w-4 h-4" />
            Pattern
          </button>
          <button
            onClick={() => onSetViewMode('arrangement')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'arrangement' && 'active')}
          >
            <List className="w-4 h-4" />
            Arrange
          </button>
        </div>

        {/* Pattern selector */}
        <div className="w-48" />
      </div>
    </nav>
  );
};
