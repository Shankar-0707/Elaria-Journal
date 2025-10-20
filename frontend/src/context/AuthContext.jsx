// /frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Check localStorage or initial state for user info
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://localhost:5000/api/auth'; // Ensure this matches your Express port

  // Axios instance configuration (Important for sending cookies!)
  const api = axios.create({
      baseURL: API_URL,
      withCredentials: true, // Crucial to send and receive cookies (JWT)
  });

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response.data.message || error.message;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/signup', { name, email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response.data.message || error.message;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/logout', {}, { withCredentials: true }); // Server clears the cookie
      setUser(null);
      localStorage.removeItem('userInfo');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};