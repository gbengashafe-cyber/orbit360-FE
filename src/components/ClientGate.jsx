import React, { useState, useEffect } from "react";
import ClientAuth from "../pages/ClientAuth";
import Logo from "./Logo";

export default function ClientGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    try {
      const storedAuth = localStorage.getItem('clientAuth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        // Check if the session is less than 24 hours old
        const isValid = (Date.now() - authData.timestamp) < (24 * 60 * 60 * 1000);
        
        if (isValid) {
          setClientInfo(authData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('clientAuth');
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      localStorage.removeItem('clientAuth');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (contact) => {
    setClientInfo({
      contactId: contact.id,
      email: contact.email,
      name: `${contact.first_name} ${contact.last_name}`,
      timestamp: Date.now()
    });
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Logo size="large" className="mx-auto mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ClientAuth onAuthenticated={handleAuthenticated} />;
  }

  return children;
}