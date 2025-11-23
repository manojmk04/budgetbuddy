import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--text)' }}>
                    <Header />
                    <main className="container" style={{ paddingTop: '1rem' }}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/reports" element={<Reports />} />
                        </Routes>
                    </main>
                    <Navbar />
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
