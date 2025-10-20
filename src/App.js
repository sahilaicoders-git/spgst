import React, { useState, useEffect } from 'react';
import ClientList from './components/ClientList';
import AddClientForm from './components/AddClientForm';
import MainApplication from './components/MainApplication';
import Header from './components/Header';
import FloatingITCBar from './components/FloatingITCBar';
import { ClientProvider } from './context/ClientContext';
// Removed Users import as we're using the SP-GST logo instead
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('clientList'); // 'clientList', 'addClient', or 'mainApp'
  const [mainAppData, setMainAppData] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Listen for menu events
    const handleMenuNewClient = () => {
      setCurrentView('addClient');
    };

    window.addEventListener('menu-new-client', handleMenuNewClient);
    
    return () => {
      window.removeEventListener('menu-new-client', handleMenuNewClient);
    };
  }, []);

  const handleAddClient = () => {
    setCurrentView('addClient');
  };

  const handleCloseForm = () => {
    setCurrentView('clientList');
  };

  const handleOpenMainApp = (selectedClients, selectedMonth) => {
    setMainAppData({
      clients: selectedClients,
      month: selectedMonth
    });
    setCurrentView('mainApp');
  };

  const handleBackToClientList = () => {
    setCurrentView('clientList');
    setMainAppData(null);
  };

  return (
    <ClientProvider>
      <div className="app">
        {/* Splash Screen */}
        {showSplash && (
          <div className={`splash-screen ${!showSplash ? 'fade-out' : ''}`}>
            <div className="splash-content">
              <div className="splash-logo">
                <img 
                  src="/spgsticon.png" 
                  alt="SP-GST Logo" 
                  className="splash-logo-img"
                />
              </div>
              <h1 className="splash-title">GST Software</h1>
              <div className="splash-subtitle">Professional GST Management</div>
              <div className="splash-loader">
                <div className="loader-bar"></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Application */}
        {!showSplash && (
          <>
            {/* Header - only show when not in main app */}
            {currentView !== 'mainApp' && (
              <Header onAddClient={handleAddClient} />
            )}
            <main className="main-content">
              {currentView === 'clientList' && (
                <ClientList onOpenMainApp={handleOpenMainApp} />
              )}
              {currentView === 'addClient' && (
                <AddClientForm onClose={handleCloseForm} />
              )}
              {currentView === 'mainApp' && (
                <>
                  <MainApplication 
                    selectedClients={mainAppData.clients}
                    selectedMonth={mainAppData.month}
                    onBack={handleBackToClientList}
                  />
                  <FloatingITCBar 
                    selectedClient={mainAppData.clients?.[0]}
                    selectedMonth={mainAppData.month}
                  />
                </>
              )}
            </main>
          </>
        )}
      </div>
    </ClientProvider>
  );
}

export default App;
