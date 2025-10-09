import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Mail, Lock, LogIn } from 'lucide-react';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            navigate('/dashboard'); // Redirect to dashboard after successful login
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-500 to-teal-600 bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center p-4">
            {/* Back to Home Button */}
            <Link 
                to="/" 
                className="absolute top-4 left-4 text-black hover:text-gray-700 transition-colors font-medium drop-shadow-md bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-md border border-black border-opacity-20 flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="bg-white bg-opacity-95 p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
                <div className="text-center mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-3xl font-bold text-emerald-800 mb-1 sm:mb-2">Welcome Back</h1>
                    <p className="text-stone-600 text-xs sm:text-base">Sign in to your Aether account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-xs sm:text-sm bg-red-50 border border-red-200 rounded-md p-2 sm:p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-2 sm:py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                        {loading ? 'Signing In...' : (
                            <>
                                <LogIn className="h-5 w-5" />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 sm:mt-6 text-center">
                    <p className="text-stone-600 text-xs sm:text-base">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;