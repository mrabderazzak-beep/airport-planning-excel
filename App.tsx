import React, { useState, useEffect, useCallback } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialisation asynchrone pour ne pas bloquer le rendu initial
    const init = async () => {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) setUser(JSON.parse(savedUser));

      const savedData = localStorage.getItem(STORAGE_KEY_DATA);
      if (savedData) {
        try {
          // Utilisation de requestAnimationFrame pour fragmenter la tâche de parsing
          const parsed = JSON.parse(savedData);
          setGridData(parsed);
        } catch (e) {
          setGridData(generateEmptyGrid(50, 30));
        }
      } else {
        setGridData(generateEmptyGrid(50, 30));
      }
      setIsReady(true);
    };
    init();
  }, []);

  const handleDataUpdate = useCallback((newData: GridData) => {
    setGridData(newData);
    // Persistance décalée pour fluidifier l'UI
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
      } catch (e) {
        console.warn("Espace de stockage saturé");
      }
    }, 500);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-blue-400 font-bold">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
    }} />;
  }

  return user.role === 'admin' ? (
    <AdminDashboard user={user} data={gridData} onDataUpdate={handleDataUpdate} onLogout={handleLogout} />
  ) : (
    <AgentDashboard user={user} data={gridData} onLogout={handleLogout} />
  );
};

export default App;