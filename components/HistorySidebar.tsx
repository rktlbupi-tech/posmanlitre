import React from 'react';
import { History, Folder, Plus, Trash2, ChevronRight, Play } from 'lucide-react';
import { Button, Badge } from './UI';
import { ApiRequest, Collection } from '../types';

interface SidebarProps {
  history: ApiRequest[];
  collections: Collection[];
  onLoadRequest: (req: ApiRequest) => void;
  onDeleteHistory: (id: string) => void;
  onCreateCollection: () => void;
  onDeleteCollection: (id: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    history, 
    collections, 
    onLoadRequest, 
    onDeleteHistory, 
    onCreateCollection, 
    onDeleteCollection,
    isOpen 
}) => {
  if (!isOpen) return null;

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600 dark:text-green-400';
      case 'POST': return 'text-yellow-600 dark:text-yellow-400';
      case 'DELETE': return 'text-red-600 dark:text-red-400';
      case 'PUT': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Explorer</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
            {/* Collections Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Folder size={12} /> Collections
                    </span>
                    <button onClick={onCreateCollection} className="text-slate-400 hover:text-primary transition-colors">
                        <Plus size={14} />
                    </button>
                </div>
                {collections.map(col => (
                    <div key={col.id} className="group flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <ChevronRight size={14} className="text-slate-400" />
                            <span className="truncate">{col.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCollection(col.id); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                {collections.length === 0 && (
                    <div className="px-4 py-2 text-xs text-slate-400 text-center italic">No collections yet</div>
                )}
            </div>

            {/* History Section */}
            <div>
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <History size={12} /> History
                    </span>
                </div>
                <div className="space-y-0.5">
                    {history.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => onLoadRequest(item)}
                            className="group flex items-center justify-between px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-sm"
                        >
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                <span className={`text-[10px] font-bold w-10 shrink-0 ${getMethodColor(item.method)}`}>{item.method}</span>
                                <span className="truncate text-slate-700 dark:text-slate-300 text-xs">{item.url || 'Untitled Request'}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0 ml-2"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                     {history.length === 0 && (
                        <div className="px-4 py-2 text-xs text-slate-400 text-center italic">No history yet</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};