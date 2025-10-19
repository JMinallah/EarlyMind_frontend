import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Mail, Lock, User, UserPlus, Users } from 'lucide-react';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'parent' // Default to parent
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            const result = await register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                userType: formData.userType
            });
            
            if (result && result.success) {
                // If registration was successful, redirect to dashboard
                navigate('/dashboard');
            } else {
                // If for some reason we don't have a success status
                setError('Registration successful, but there was an issue logging in. Please try logging in manually.');
            }
        } catch (error) {
            setError(error.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-500 to-teal-600 bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center p-4 md:p-6 lg:p-8">
            {/* Back to Home Button - Responsive positioning and sizing */}
            <Link 
                to="/" 
                className="absolute top-4 left-4 md:top-6 md:left-6 text-black hover:text-gray-700 transition-colors font-medium drop-shadow-md bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-md border border-black border-opacity-20 flex items-center gap-2 text-sm md:text-base"
            >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden xs:inline">Home</span>
                <span className="inline xs:hidden">Back</span>
            </Link>

            <div className="bg-white bg-opacity-95 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl backdrop-blur-sm border border-white/20">
                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-800 mb-1 sm:mb-2 md:mb-3">Join EarlyMind</h1>
                    <p className="text-stone-600 text-xs sm:text-sm md:text-base lg:text-lg">Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                    {/* Form grid layout that switches to two columns on md screens */}
                    <div className="md:grid md:grid-cols-2 md:gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm md:text-base font-medium text-stone-700 mb-1 md:mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className="mt-3 md:mt-0">
                            <label htmlFor="email" className="block text-sm md:text-base font-medium text-stone-700 mb-1 md:mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* User Type Selection - Full width on all screens */}
                    <div>
                        <label htmlFor="userType" className="block text-sm md:text-base font-medium text-stone-700 mb-1 md:mb-2">
                            I am a
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Users className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                id="userType"
                                name="userType"
                                value={formData.userType}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base appearance-none"
                            >
                                <option value="parent">Parent</option>
                                <option value="professional">Professional</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                  

                    {/* Password fields - Two columns on larger screens */}
                    <div className="md:grid md:grid-cols-2 md:gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm md:text-base font-medium text-stone-700 mb-1 md:mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
                                    placeholder="Create a password (min 8 characters)"
                                />
                            </div>
                        </div>

                        <div className="mt-3 md:mt-0">
                            <label htmlFor="confirmPassword" className="block text-sm md:text-base font-medium text-stone-700 mb-1 md:mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-xs sm:text-sm md:text-base bg-red-50 border border-red-200 rounded-md p-2 sm:p-3 md:p-4 shadow-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit button - larger and more prominent on bigger screens */}
                    <div className="mt-6 md:mt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-2.5 sm:py-3 md:py-4 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5 md:h-6 md:w-6" />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-5 sm:mt-6 md:mt-8 text-center">
                    <p className="text-stone-600 text-xs sm:text-sm md:text-base">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;