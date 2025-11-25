import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button, Input } from './UI';
import { KeyValueItem } from '../types';

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  title?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, onChange }) => {
  const updateItem = (index: number, field: keyof KeyValueItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // If editing the last item's key/value, add a new empty row automatically
    if (index === items.length - 1 && (field === 'key' || field === 'value') && value !== '') {
        newItems.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
    }
    onChange(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
       newItems.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
    }
    onChange(newItems);
  };

  const toggleItem = (index: number) => {
    updateItem(index, 'enabled', !items[index].enabled);
  };

  return (
    <div className="w-full border rounded-md border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
            <div className="w-10 px-2 py-2 text-center"></div>
            <div className="flex-1 px-3 py-2 border-r border-slate-200 dark:border-slate-800">Key</div>
            <div className="flex-1 px-3 py-2 border-r border-slate-200 dark:border-slate-800">Value</div>
            <div className="w-12 px-2 py-2"></div>
        </div>
      {items.map((item, index) => (
        <div key={item.id} className="flex group border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
          <div className="w-10 flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => toggleItem(index)}
              className="rounded border-slate-300 dark:border-slate-700"
            />
          </div>
          <div className="flex-1 border-r border-slate-100 dark:border-slate-800">
            <input
              className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder="Key"
              value={item.key}
              onChange={(e) => updateItem(index, 'key', e.target.value)}
            />
          </div>
          <div className="flex-1 border-r border-slate-100 dark:border-slate-800">
            <input
              className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder="Value"
              value={item.value}
              onChange={(e) => updateItem(index, 'value', e.target.value)}
            />
          </div>
          <div className="w-12 flex items-center justify-center">
            {items.length > 1 && (
                <button
                onClick={() => deleteItem(index)}
                className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                <Trash2 size={14} />
                </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};