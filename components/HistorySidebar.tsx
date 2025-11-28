import React, { useState, useRef, useEffect } from 'react';
import { History, Folder, Plus, Trash2, ChevronRight, ChevronDown, Play, Share2, FileText, MoreVertical, Edit2, Check, X, FilePlus } from 'lucide-react';
import { Button, Badge } from './UI';
import { ApiRequest, Collection } from '../types';

interface SidebarProps {
    history: ApiRequest[];
    collections: Collection[];
    onLoadRequest: (req: ApiRequest, preserveId?: boolean) => void;
    onDeleteHistory: (id: string) => void;
    onCreateCollection: (name: string) => void;
    onDeleteCollection: (id: string) => void;
    onShareCollection: (collection: Collection) => void;
    isOpen: boolean;
    onAddFolder?: (collectionId: string, parentId: string | undefined, name: string) => void;
    onAddRequest?: (collectionId: string, folderId: string | undefined, method: string, name: string) => void;
    onDeleteFolder?: (collectionId: string, folderId: string) => void;
    onDeleteRequest?: (collectionId: string, requestId: string) => void;
    onRenameCollection?: (id: string, newName: string) => void;
    onRenameFolder?: (collectionId: string, folderId: string, newName: string) => void;
    onRenameRequest?: (collectionId: string, requestId: string, newName: string) => void;
}

const CollectionTreeItem: React.FC<{
    item: Collection;
    level?: number;
    onLoadRequest: (req: ApiRequest, preserveId?: boolean) => void;
    onDeleteCollection: (id: string) => void;
    onShareCollection: (col: Collection) => void;
    onAddFolder?: (colId: string, parentId: string | undefined, name: string) => void;
    onAddRequest?: (colId: string, folderId: string | undefined, method: string, name: string) => void;
    onDeleteFolder?: (colId: string, folderId: string) => void;
    onDeleteRequest?: (colId: string, reqId: string) => void;
    onRenameCollection?: (id: string, newName: string) => void;
    onRenameFolder?: (colId: string, folderId: string, newName: string) => void;
    onRenameRequest?: (colId: string, reqId: string, newName: string) => void;
    rootCollectionId: string;
}> = ({ item, level = 0, onLoadRequest, onDeleteCollection, onShareCollection, onAddFolder, onAddRequest, onDeleteFolder, onDeleteRequest, onRenameCollection, onRenameFolder, onRenameRequest, rootCollectionId }) => {
    const [expanded, setExpanded] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(item.name);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);
    const [newRequestName, setNewRequestName] = useState('');
    const [newRequestMethod, setNewRequestMethod] = useState('GET');

    const renameInputRef = useRef<HTMLInputElement>(null);
    const createFolderInputRef = useRef<HTMLInputElement>(null);
    const createRequestInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        if (isCreatingFolder && createFolderInputRef.current) {
            createFolderInputRef.current.focus();
        }
    }, [isCreatingFolder]);

    useEffect(() => {
        if (isCreatingRequest && createRequestInputRef.current) {
            createRequestInputRef.current.focus();
        }
    }, [isCreatingRequest]);

    const handleRenameSubmit = () => {
        if (renameValue.trim()) {
            if (level === 0) {
                onRenameCollection?.(item.id, renameValue);
            } else {
                onRenameFolder?.(rootCollectionId, item.id, renameValue);
            }
        }
        setIsRenaming(false);
    };

    const handleCreateFolderSubmit = () => {
        if (newFolderName.trim()) {
            onAddFolder?.(rootCollectionId, item.id, newFolderName);
        }
        setIsCreatingFolder(false);
        setNewFolderName('');
        setExpanded(true);
    };

    const handleCreateRequestSubmit = () => {
        if (newRequestName.trim()) {
            onAddRequest?.(rootCollectionId, item.id, newRequestMethod, newRequestName);
        }
        setIsCreatingRequest(false);
        setNewRequestName('');
        setNewRequestMethod('GET');
        setExpanded(true);
    };

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
        <div className="select-none">
            <div
                className={`group flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-sm ${level > 0 ? 'ml-4' : ''}`}
                onClick={() => !isRenaming && setExpanded(!expanded)}
            >
                {/* ... (Folder item content remains same) ... */}
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    <Folder size={14} className="text-yellow-500 shrink-0" />

                    {isRenaming ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit();
                                    if (e.key === 'Escape') setIsRenaming(false);
                                }}
                                onBlur={handleRenameSubmit}
                                className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                        </div>
                    ) : (
                        <span className="truncate">{item.name}</span>
                    )}
                </div>

                {!isRenaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {level === 0 && (
                            <button onClick={(e) => { e.stopPropagation(); onShareCollection(item); }} className="text-slate-400 hover:text-blue-500" title="Share Collection">
                                <Share2 size={12} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="text-slate-400 hover:text-blue-500" title="Rename">
                            <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsCreatingRequest(true); setExpanded(true); }} className="text-slate-400 hover:text-green-500" title="Add Request">
                            <FilePlus size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(true); setExpanded(true); }} className="text-slate-400 hover:text-primary" title="Add Folder">
                            <Plus size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); level === 0 ? onDeleteCollection(item.id) : onDeleteFolder?.(rootCollectionId, item.id); }} className="text-slate-400 hover:text-red-500" title="Delete">
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* ... (Inline inputs remain same) ... */}
            {isCreatingFolder && (
                <div className={`flex items-center gap-2 px-2 py-1.5 ${level > 0 ? 'ml-8' : 'ml-4'}`}>
                    <Folder size={14} className="text-yellow-500 shrink-0" />
                    <input
                        ref={createFolderInputRef}
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolderSubmit();
                            if (e.key === 'Escape') setIsCreatingFolder(false);
                        }}
                        onBlur={handleCreateFolderSubmit}
                        placeholder="Folder Name"
                        className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                    />
                </div>
            )}

            {/* Inline Create Request Input */}
            {isCreatingRequest && (
                <div className={`flex items-center gap-1 px-2 py-1.5 ${level > 0 ? 'ml-8' : 'ml-4'}`}>
                    <select
                        value={newRequestMethod}
                        onChange={(e) => setNewRequestMethod(e.target.value)}
                        className="text-[10px] font-bold bg-transparent border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DEL</option>
                        <option value="PATCH">PAT</option>
                    </select>
                    <input
                        ref={createRequestInputRef}
                        type="text"
                        value={newRequestName}
                        onChange={(e) => setNewRequestName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateRequestSubmit();
                            if (e.key === 'Escape') setIsCreatingRequest(false);
                        }}
                        placeholder="Request Name"
                        className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                    />
                </div>
            )}

            {expanded && (
                <div>
                    {item.folders?.map(folder => (
                        <CollectionTreeItem
                            key={folder.id}
                            item={folder}
                            level={level + 1}
                            onLoadRequest={onLoadRequest}
                            onDeleteCollection={onDeleteCollection}
                            onShareCollection={onShareCollection}
                            onAddFolder={onAddFolder}
                            onAddRequest={onAddRequest}
                            onDeleteFolder={onDeleteFolder}
                            onDeleteRequest={onDeleteRequest}
                            onRenameCollection={onRenameCollection}
                            onRenameFolder={onRenameFolder}
                            onRenameRequest={onRenameRequest}
                            rootCollectionId={rootCollectionId}
                        />
                    ))}
                    {item.requests?.map(req => (
                        <RequestItem
                            key={req.id}
                            req={req}
                            level={level}
                            rootCollectionId={rootCollectionId}
                            onLoadRequest={(r) => onLoadRequest(r, true)} // Pass true to preserve ID
                            onDeleteRequest={onDeleteRequest}
                            onRenameRequest={onRenameRequest}
                        />
                    ))}
                    {(!item.folders?.length && !item.requests?.length && !isCreatingFolder && !isCreatingRequest) && (
                        <div className={`px-2 py-1 text-xs text-slate-400 italic ${level > 0 ? 'ml-8' : 'ml-4'}`}>Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

const RequestItem: React.FC<{
    req: ApiRequest;
    level: number;
    rootCollectionId: string;
    onLoadRequest: (req: ApiRequest, preserveId?: boolean) => void;
    onDeleteRequest?: (colId: string, reqId: string) => void;
    onRenameRequest?: (colId: string, reqId: string, newName: string) => void;
}> = ({ req, level, rootCollectionId, onLoadRequest, onDeleteRequest, onRenameRequest }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(req.name || req.url);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        if (renameValue.trim()) {
            onRenameRequest?.(rootCollectionId, req.id, renameValue);
        }
        setIsRenaming(false);
    };

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
        <div
            className={`group flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-sm ${level > 0 ? 'ml-8' : 'ml-4'}`}
            onClick={() => !isRenaming && onLoadRequest(req, true)} // Pass true to preserve ID
        >
            <div className="flex items-center gap-2 overflow-hidden w-full">
                <span className={`text-[10px] font-bold w-8 shrink-0 ${getMethodColor(req.method)}`}>{req.method}</span>

                {isRenaming ? (
                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') setIsRenaming(false);
                            }}
                            onBlur={handleRenameSubmit}
                            className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                        />
                    </div>
                ) : (
                    <span className="truncate text-slate-700 dark:text-slate-300 text-xs">{req.name || req.url}</span>
                )}
            </div>

            {!isRenaming && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="text-slate-400 hover:text-blue-500 shrink-0" title="Rename">
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteRequest?.(rootCollectionId, req.id); }}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
    history,
    collections,
    onLoadRequest,
    onDeleteHistory,
    onCreateCollection,
    onDeleteCollection,
    onShareCollection,
    isOpen,
    onAddFolder,
    onAddRequest,
    onDeleteFolder,
    onDeleteRequest,
    onRenameCollection,
    onRenameFolder,
    onRenameRequest
}) => {
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const createInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreatingCollection && createInputRef.current) {
            createInputRef.current.focus();
        }
    }, [isCreatingCollection]);

    const handleCreateSubmit = () => {
        if (newCollectionName.trim()) {
            onCreateCollection(newCollectionName);
        }
        setIsCreatingCollection(false);
        setNewCollectionName('');
    };

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
                            <button onClick={() => setIsCreatingCollection(true)} className="text-slate-400 hover:text-primary transition-colors">
                                <Plus size={14} />
                            </button>
                        </div>

                        {isCreatingCollection && (
                            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                <Folder size={14} className="text-yellow-500 shrink-0" />
                                <input
                                    ref={createInputRef}
                                    type="text"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateSubmit();
                                        if (e.key === 'Escape') setIsCreatingCollection(false);
                                    }}
                                    onBlur={handleCreateSubmit}
                                    placeholder="Collection Name"
                                    className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                                />
                            </div>
                        )}

                        {collections.map(col => (
                            <CollectionTreeItem
                                key={col.id}
                                item={col}
                                onLoadRequest={onLoadRequest}
                                onDeleteCollection={onDeleteCollection}
                                onShareCollection={onShareCollection}
                                onAddFolder={onAddFolder}
                                onAddRequest={onAddRequest}
                                onDeleteFolder={onDeleteFolder}
                                onDeleteRequest={onDeleteRequest}
                                onRenameCollection={onRenameCollection}
                                onRenameFolder={onRenameFolder}
                                onRenameRequest={onRenameRequest}
                                rootCollectionId={col.id}
                            />
                        ))}
                        {collections.length === 0 && !isCreatingCollection && (
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