import { ViewMode } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Grid3X3, LayoutGrid, List } from 'lucide-react';

interface NavigationProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
}

export const Navigation = ({ viewMode, onSetViewMode }: NavigationProps) => {
  return (
    <nav className="border-b-4 border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary flex items-center justify-center glow-green border-4 border-primary">
            <span className="font-pixel text-sm text-primary-foreground">8B</span>
          </div>
          <div>
            <h1 className="font-pixel text-base text-foreground tracking-tight">BEATFORGE</h1>
            <p className="font-pixel text-[8px] text-muted-foreground uppercase tracking-widest">
              8-BIT DRUM MACHINE
            </p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetViewMode('pads')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'pads' && 'active')}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">PADS</span>
          </button>
          <button
            onClick={() => onSetViewMode('pattern')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'pattern' && 'active')}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">PATTERN</span>
          </button>
          <button
            onClick={() => onSetViewMode('arrangement')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'arrangement' && 'active')}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">ARRANGE</span>
          </button>
        </div>

        {/* Decorative */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive animate-pulse" />
          <div className="w-3 h-3 bg-accent" />
          <div className="w-3 h-3 bg-primary" />
        </div>
      </div>
    </nav>
  );
};
