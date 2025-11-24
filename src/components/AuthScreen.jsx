import React, { useState } from 'react';
import { Bus, User, Lock } from 'lucide-react'; // Icons for UI
import Button from './Button'; // Custom Button component
import Input from './Input';   // Custom Input component

// AuthScreen handles both Login and Signup UI
const AuthScreen = ({ onLogin, onSignup, mode, setMode, error, loading }) => {
  // State to hold user input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle form submission
  const handleSubmit = e => {
    e.preventDefault(); // Prevent page refresh on submit
    if (mode === 'login') {
      onLogin(email, password);   // Call login function passed as prop
    } else {
      onSignup(email, password);  // Call signup function passed as prop
    }
  };

  return (
    // Fullscreen container with gradient background
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col justify-center px-6 overflow-hidden">
      
      {/* Decorative blurred circles fo*
