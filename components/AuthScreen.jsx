import React, { useState } from 'react';
import { Bus, User, Lock } from 'lucide-react';
import Button from './Button';
import Input from './InputField';

const AuthScreen = ({ onLogin, onSignup, mode, setMode, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(email, password);
    } else {
      onSignup(email, password);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col justify-center px-6 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6 rotate-3 transform transition-transform hover:rotate-0 duration-500">
            <Bus className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">BusLink</h1>
          <p className="text-blue-100 text-lg opacity-90">Smart Transit for Sri Lanka</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              icon={User}
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
            />
            <Input
              icon={Lock}
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
            />

            <Button
              type="submit"
              variant={mode === 'login' ? 'primary' : 'accent'}
              loading={loading}
              className="mt-4"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'login' ? 'New to BusLink? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
