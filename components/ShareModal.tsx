import React, { useState } from 'react';
import { Collection } from '../types';
import { Button, Input } from './UI';
import { X, Copy, Check, Lock, Link as LinkIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    collection: Collection | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, collection }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !collection) return null;

    const handleShare = async () => {
        if (!password) {
            setError('Password is required for secure sharing');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const dataToEncrypt = JSON.stringify(collection);
            const encryptedData = CryptoJS.AES.encrypt(dataToEncrypt, password).toString();

            const docRef = await addDoc(collection(db, "shared_collections"), {
                data: encryptedData,
                timestamp: Date.now(),
                name: collection.name // Optional: store name unencrypted for display? Maybe not for max security, but helpful. Let's store it.
            });

            const link = `${window.location.origin}?share_id=${docRef.id}`;
            setGeneratedLink(link);
        } catch (err: any) {
            console.error("Error sharing:", err);
            setError('Failed to generate share link. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setPassword('');
        setGeneratedLink('');
        setError('');
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold flex items-center gap-2"><Lock size={16} /> Share "{collection.name}"</h3>
                    <button onClick={reset} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                    {!generatedLink ? (
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded text-sm">
                                Set a password to encrypt this collection. Only people with the password can access it.
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Set Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter a strong password"
                                />
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <Button onClick={handleShare} disabled={loading} className="w-full">
                                {loading ? 'Generating Link...' : 'Generate Secure Link'}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2">
                                    <LinkIcon size={24} />
                                </div>
                                <h4 className="font-bold text-lg">Link Generated!</h4>
                                <p className="text-slate-500 text-sm">Share this link and the password with others.</p>
                            </div>

                            <div className="flex gap-2">
                                <Input value={generatedLink} readOnly />
                                <Button onClick={copyLink} variant="outline" size="icon">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs">
                                <strong>Important:</strong> If you lose the password, this link will be useless. We cannot recover it.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
