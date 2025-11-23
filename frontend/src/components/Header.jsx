import React from 'react';
import { Wallet, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem'
        }}>
            <div className="container flex justify-between items-center" style={{ padding: 0 }}>
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <Wallet size={28} />
                    <span>BudgetBuddy</span>
                </div>

                <button onClick={toggleTheme} className="btn" style={{ background: 'var(--background)', padding: '0.5rem' }}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>
    );
};

export default Header;
