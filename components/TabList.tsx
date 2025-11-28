import React from 'react';
import { RequestTab } from '../types';
import { X, Plus } from 'lucide-react';

interface TabListProps {
    tabs: RequestTab[];
    activeTabId: string;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
}

export const TabList: React.FC<TabListProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) => {
    return (
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`group flex items-center gap-2 px-3 py-2 text-xs font-medium border-r border-slate-200 dark:border-slate-800 cursor-pointer min-w-[120px] max-w-[200px] select-none ${activeTabId === tab.id
                            ? 'bg-white dark:bg-slate-950 text-primary border-t-2 border-t-primary'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-t-2 border-t-transparent'
                        }`}
                    onClick={() => onSelectTab(tab.id)}
                >
                    <span className={`flex-1 truncate ${tab.request.method === 'GET' ? 'text-green-600' : tab.request.method === 'POST' ? 'text-yellow-600' : tab.request.method === 'DELETE' ? 'text-red-600' : 'text-blue-600'}`}>
                        {tab.request.method}
                    </span>
                    <span className="truncate flex-1 text-slate-700 dark:text-slate-300" title={tab.title}>
                        {tab.title}
                    </span>
                    {tab.isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab(tab.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
            <button
                onClick={onNewTab}
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};
