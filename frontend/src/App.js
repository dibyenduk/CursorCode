import React, { useState } from 'react';
import './App.css';
import PersonLocationForm from './components/PersonLocationForm';
import Notification from './components/Notification';

function App() {
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Person Location Management</h1>
          <p>Store person information and drop-off location securely</p>
        </header>
        <PersonLocationForm onSuccess={() => showNotification('Data stored successfully!', 'success')} 
                          onError={(error) => showNotification(error, 'error')} />
        {notification.message && (
          <Notification message={notification.message} type={notification.type} />
        )}
      </div>
    </div>
  );
}

export default App;
