import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagKind } from '../../engine/constants';
import { Tag } from './Tag';

export interface WhyInput {
  name: string;
  value: string | number;
  tag?: TagKind;
}

interface WhyProps {
  children: React.ReactNode;
  tag: TagKind;
  meaning: string;
  formula?: string;
  inputs?: WhyInput[];
  source?: string;
  epoch?: string;
  age?: string;
  className?: string;
}

export const Why: React.FC<WhyProps> = ({
  children,
  tag,
  meaning,
  formula,
  inputs,
  source,
  epoch,
  age,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 group cursor-help ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <span className="tabular-nums font-medium text-chalk border-b border-dotted border-chalk-faint/60 hover:border-sky transition-colors">
        {children}
      </span>
      <Tag kind={tag} />

      {open && (
        <div
          role="dialog"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-navy-900 border border-line text-chalk rounded-control shadow-xl text-xs space-y-2 pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-1 border-b border-line">
            <span className="font-semibold text-sky">Truth ledger</span>
            <Tag kind={tag} />
          </div>

          <p className="text-chalk-dim leading-relaxed">{meaning}</p>

          {formula && (
            <div className="bg-navy-950 p-2 border border-line/50 rounded-control">
              <span className="text-[10px] text-chalk-faint block uppercase tracking-wider">Formula</span>
              <code className="text-chalk text-[11px] font-mono break-all">{formula}</code>
            </div>
          )}

          {inputs && inputs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-chalk-faint block uppercase tracking-wider">Inputs</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {inputs.map((inp, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-navy-950/60 px-1.5 py-0.5 rounded-control">
                    <span className="text-chalk-dim">{inp.name}:</span>
                    <span className="font-mono text-chalk tabular-nums">
                      {inp.value}
                      {inp.tag && <span className="ml-1 text-[9px] text-chalk-faint">({inp.tag[0]})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {source && (
            <div className="text-[11px] text-chalk-dim pt-1 border-t border-line/40">
              <span className="text-chalk-faint">Source: </span>
              {source}
              {epoch && <div className="text-[10px] text-chalk-faint">Epoch: {epoch}</div>}
              {age && <div className="text-[10px] text-chalk-faint">Data age: {age}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
