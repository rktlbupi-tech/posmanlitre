import React, { useState, useEffect } from 'react';
import { Collection } from '../types';
import { Button, Input } from './UI';
import { X, Download, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareId: string | null;
    onImport: (collection: Collection) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, shareId, onImport }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [collectionName, setCollectionName] = useState<string | null>(null);
    const [encryptedData, setEncryptedData] = useState<string | null>(null);

    // Fetch basic info (name) when opened
    useEffect(() => {
        if (isOpen && shareId) {
            setFetching(true);
            setError('');
            getDoc(doc(db, "shared_collections", shareId))
                .then(snap => {
                    if (snap.exists()) {
                        const data = snap.data();
                        setCollectionName(data.name || "Unnamed Collection");
                        setEncryptedData(data.data);
                    } else {
                        setError("Collection not found. The link might be invalid or expired.");
                    }
                })
                .catch(err => {
                    setError("Failed to load collection info. " + err.message);
                })
                .finally(() => {
                    setFetching(false);
                });
        } else {
            // Reset state when closed
            setPassword('');
            setCollectionName(null);
            setEncryptedData(null);
            setError('');
        }
    }, [isOpen, shareId]);

    if (!isOpen) return null;

    const handleImport = () => {
        if (!password) {
            setError('Password is required');
            return;
        }
        if (!encryptedData) return;

        setLoading(true);
        setError('');

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) {
                throw new Error("Incorrect password or corrupted data");
            }

            const collection: Collection = JSON.parse(decryptedString);

            // Validate structure roughly
            if (!collection.requests || !Array.isArray(collection.requests)) {
                throw new Error("Invalid collection format");
            }

            // Assign new ID to avoid conflicts? Or keep same? 
            // Let's keep same ID but maybe user wants a copy. 
            // For now, just import as is.

            onImport(collection);
            onClose();
        } catch (err: any) {
            console.error("Import error:", err);
            setError("Failed to decrypt. " + (err.message === "Malformed UTF-8 data" ? "Incorrect password." : err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold flex items-center gap-2"><Download size={16} /> Import Collection</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error && !encryptedData ? (
                        <div className="text-red-500 text-center py-4">
                            <AlertCircle className="mx-auto mb-2" />
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-4">
                                <p className="text-slate-500 text-sm">You are importing:</p>
                                <h4 className="font-bold text-lg">{collectionName}</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Enter Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password provided by sender"
                                    onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                                />
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <Button onClick={handleImport} disabled={loading} className="w-full">
                                {loading ? 'Decrypting & Importing...' : 'Unlock & Import'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
