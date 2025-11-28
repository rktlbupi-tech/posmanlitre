import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Button, Input } from './UI';
import { X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg">{isLogin ? 'Login' : 'Sign Up'}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" className="w-full" loading={loading}>
                        {isLogin ? 'Login' : 'Sign Up'}
                    </Button>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary hover:underline font-medium"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
