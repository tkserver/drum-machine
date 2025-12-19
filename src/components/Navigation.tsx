import { ViewMode, SoundKitId, SOUND_KITS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Grid3X3, LayoutGrid, List, Save, FolderOpen, Trash2 } from 'lucide-react';

interface NavigationProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  currentKit: SoundKitId;
  onChangeKit: (kit: SoundKitId) => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
}

export const Navigation = ({ 
  viewMode, 
  onSetViewMode, 
  currentKit, 
  onChangeKit,
  onSave,
  onLoad,
  onClear,
}: NavigationProps) => {
  return (
    <nav className="border-b-4 border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary flex items-center justify-center glow-green border-4 border-primary">
            <span className="font-pixel text-sm text-primary-foreground">8B</span>
          </div>
          <div>
            <h1 className="font-pixel text-base text-foreground tracking-tight">DRUM MACHINE</h1>
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
          <button
            onClick={() => onSetViewMode('mixer')}
            className={cn('nav-button flex items-center gap-2', viewMode === 'mixer' && 'active')}
          >
            <span className="w-4 h-4 flex items-center justify-center">🎛️</span>
            <span className="hidden sm:inline">MIXER</span>
          </button>
        </div>

        {/* Kit selector & File operations */}
        <div className="flex items-center gap-3">
          {/* Kit selector */}
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-muted-foreground">KIT:</span>
            <select
              value={currentKit}
              onChange={(e) => onChangeKit(e.target.value as SoundKitId)}
              className="pixel-select px-3 py-2 text-base"
            >
              {SOUND_KITS.map((kit) => (
                <option key={kit.id} value={kit.id}>{kit.name}</option>
              ))}
            </select>
          </div>

          {/* File operations */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSave}
              className="nav-button flex items-center gap-2"
              title="Save patterns"
            >
              <Save className="w-4 h-4" />
              <span className="hidden md:inline">SAVE</span>
            </button>
            <button
              onClick={onLoad}
              className="nav-button flex items-center gap-2"
              title="Load patterns"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden md:inline">LOAD</span>
            </button>
            <button
              onClick={onClear}
              className="nav-button flex items-center gap-2 hover:!bg-destructive/20 hover:!text-destructive"
              title="Clear all patterns"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status LEDs */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive animate-pulse" />
            <div className="w-3 h-3 bg-accent" />
            <div className="w-3 h-3 bg-primary" />
          </div>
        </div>
      </div>
    </nav>
  );
};
