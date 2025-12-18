import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { User, GridData } from './types';
import { generateEmptyGrid } from './utils/excelUtils';

const STORAGE_KEY_DATA = 'airport_planning_data';
const STORAGE_KEY_USER = 'airport_planning_user';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gridData, setGridData] = useState<GridData>([]);

  // Load initial data
  useEffect(() => {
    // Load User
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load Data
    const savedData = localStorage.getItem(STORAGE_KEY_DATA);
    if (savedData) {
      try {
        setGridData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved data, resetting");
        setGridData(generateEmptyGrid(50, 30));
      }
    } else {
      setGridData(generateEmptyGrid(50, 30));
    }
  }, []);

  // Persist User
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  // Persist Data (Debounced ideally, but direct for this scale is fine)
  const handleDataUpdate = (newData: GridData) => {
    setGridData(newData);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        data={gridData} 
        onDataUpdate={handleDataUpdate} 
        onLogout={() => setUser(null)} 
      />
    );
  }

  return (
    <AgentDashboard 
      user={user} 
      data={gridData} 
      onLogout={() => setUser(null)} 
    />
  );
};

export default App;
