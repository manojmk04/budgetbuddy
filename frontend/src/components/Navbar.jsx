import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, ArrowRightLeft } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
        { path: '/accounts', label: 'Accounts', icon: Wallet },
        { path: '/reports', label: 'Reports', icon: PieChart },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            padding: '0.5rem 1rem',
            zIndex: 100
        }}>
            <div className="container flex justify-between items-center" style={{ padding: 0 }}>
                {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                        key={path}
                        to={path}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
                            fontSize: '0.75rem'
                        }}
                    >
                        <Icon size={24} />
                        <span>{label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
