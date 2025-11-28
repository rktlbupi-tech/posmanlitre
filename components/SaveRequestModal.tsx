import React, { useState } from 'react';
import { Collection } from '../types';
import { Button, Input, Select } from './UI';
import { X, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface SaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    collections: Collection[];
    onSave: (collectionId: string, folderId: string | undefined, name: string) => void;
    initialName?: string;
}

export const SaveRequestModal: React.FC<SaveRequestModalProps> = ({ isOpen, onClose, collections, onSave, initialName = 'New Request' }) => {
    const [name, setName] = useState(initialName);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedFolders(newSet);
    };

    const renderFolderOption = (item: Collection, level = 0) => {
        const isSelected = selectedFolderId === item.id || (level === 0 && selectedCollectionId === item.id && !selectedFolderId);
        // Logic for selection:
        // If level 0, it's a collection.
        // If level > 0, it's a folder.

        // Actually, let's simplify selection.
        // We select an ID. We need to know if it's a root collection or a folder.
        // But the callback expects (collectionId, folderId).
        // So if we select a root collection, folderId is undefined.
        // If we select a folder, we need to know its root collection.
        // This is hard with just a recursive render unless we pass context.

        // Alternative: Just select the item.id. Then find it in the tree to get the root ID.

        return (
            <div key={item.id}>
                <div
                    className={`flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        // This logic is tricky without knowing the root.
                        // Let's just handle it in the parent or pass rootId down.
                    }}
                >
                    {/* ... UI ... */}
                </div>
            </div>
        );
    };

    // Simplified approach: Select Collection first, then Folder (if any).
    // Or just a flat list of "Collection / Folder / Subfolder" if not too many.

    // Let's stick to: Select Collection (Dropdown), then Select Folder (Dropdown - flattened).

    const getFlattenedFolders = (col: Collection): { id: string, name: string, level: number }[] => {
        let result: { id: string, name: string, level: number }[] = [];
        const traverse = (item: Collection, level: number) => {
            if (item.folders) {
                item.folders.forEach(f => {
                    result.push({ id: f.id, name: f.name, level });
                    traverse(f, level + 1);
                });
            }
        };
        traverse(col, 0);
        return result;
    };

    const currentCollection = collections.find(c => c.id === selectedCollectionId);
    const folders = currentCollection ? getFlattenedFolders(currentCollection) : [];

    const handleSave = () => {
        if (!selectedCollectionId) return;
        onSave(selectedCollectionId, selectedFolderId, name);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg">Save Request</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Request Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Request"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Collection</label>
                        <select
                            className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-slate-800"
                            value={selectedCollectionId}
                            onChange={(e) => {
                                setSelectedCollectionId(e.target.value);
                                setSelectedFolderId(undefined);
                            }}
                        >
                            <option value="">Select a collection...</option>
                            {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {currentCollection && folders.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Folder (Optional)</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-slate-800"
                                value={selectedFolderId || ''}
                                onChange={(e) => setSelectedFolderId(e.target.value || undefined)}
                            >
                                <option value="">Root (No Folder)</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0'.repeat(f.level * 2)}{f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!name || !selectedCollectionId}>Save</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
