import React, { useState } from 'react';
import { Environment, KeyValueItem } from '../types';
import { Button, Input } from './UI';
import { KeyValueEditor } from './KeyValueEditor';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface EnvironmentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    environments: Environment[];
    activeEnvironmentId: string;
    onSelectEnvironment: (id: string) => void;
    onUpdateEnvironment: (env: Environment) => void;
    onCreateEnvironment: (name: string) => void;
    onDeleteEnvironment: (id: string) => void;
}

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
    isOpen,
    onClose,
    environments,
    activeEnvironmentId,
    onSelectEnvironment,
    onUpdateEnvironment,
    onCreateEnvironment,
    onDeleteEnvironment,
}) => {
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(activeEnvironmentId || (environments.length > 0 ? environments[0].id : null));
    const [isCreating, setIsCreating] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    if (!isOpen) return null;

    const selectedEnv = environments.find(e => e.id === selectedEnvId);

    const handleCreate = () => {
        if (newEnvName.trim()) {
            onCreateEnvironment(newEnvName.trim());
            setNewEnvName('');
            setIsCreating(false);
        }
    };

    const handleRename = (id: string) => {
        const env = environments.find(e => e.id === id);
        if (env && editNameValue.trim()) {
            onUpdateEnvironment({ ...env, name: editNameValue.trim() });
            setEditingNameId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg">Manage Environments</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Sidebar List */}
                    <div className="w-64 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50">
                        <div className="mb-2">
                            <Button variant="outline" className="w-full justify-start" onClick={() => setIsCreating(true)}>
                                <Plus size={14} className="mr-2" /> New Environment
                            </Button>
                        </div>

                        {isCreating && (
                            <div className="flex gap-1 mb-2">
                                <Input
                                    autoFocus
                                    value={newEnvName}
                                    onChange={(e) => setNewEnvName(e.target.value)}
                                    placeholder="Name"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />
                                <Button size="icon" onClick={handleCreate}><Check size={14} /></Button>
                                <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)}><X size={14} /></Button>
                            </div>
                        )}

                        <div className="space-y-1">
                            {environments.map(env => (
                                <div
                                    key={env.id}
                                    className={`group flex items-center justify-between p-2 rounded cursor-pointer ${selectedEnvId === env.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    onClick={() => setSelectedEnvId(env.id)}
                                >
                                    {editingNameId === env.id ? (
                                        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                            <Input
                                                autoFocus
                                                value={editNameValue}
                                                onChange={(e) => setEditNameValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRename(env.id)}
                                                className="h-7 text-xs"
                                            />
                                            <button onClick={() => handleRename(env.id)} className="p-1 hover:bg-slate-200 rounded"><Check size={12} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="truncate flex-1 text-sm font-medium">{env.name}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-1 text-slate-400 hover:text-blue-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingNameId(env.id);
                                                        setEditNameValue(env.name);
                                                    }}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    className="p-1 text-slate-400 hover:text-red-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this environment?')) onDeleteEnvironment(env.id);
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
                        {selectedEnv ? (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <h4 className="font-bold">{selectedEnv.name}</h4>
                                    {activeEnvironmentId === selectedEnv.id ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                                    ) : (
                                        <Button size="sm" onClick={() => onSelectEnvironment(selectedEnv.id)}>Set Active</Button>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <KeyValueEditor
                                        items={selectedEnv.variables}
                                        onChange={(newVars) => onUpdateEnvironment({ ...selectedEnv, variables: newVars })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                Select an environment to edit variables
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
