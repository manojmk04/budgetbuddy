import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ total_balance: 0, monthly_income: 0, monthly_expense: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [filter, setFilter] = useState('month'); // day, week, month, year

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            let start = new Date();
            let end = new Date();

            if (filter === 'day') {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (filter === 'week') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
            } else if (filter === 'month') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(start.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
            } else if (filter === 'year') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
            }

            const statsRes = await api.get(`/dashboard/?start_date=${start.toISOString()}&end_date=${end.toISOString()}`);
            setStats(statsRes.data);
            const transRes = await api.get('/transactions/?limit=5');
            setRecentTransactions(transRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    return (
        <div className="flex flex-col gap-4" style={{ paddingBottom: '80px' }}>
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl">Dashboard</h1>
                    <p className="text-muted">Welcome back</p>
                </div>
                <div className="flex gap-1 bg-surface p-1 rounded" style={{ background: 'var(--surface)' }}>
                    {['day', 'week', 'month', 'year'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : ''}`}
                            style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.8rem',
                                textTransform: 'capitalize',
                                background: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <div className="flex items-center gap-2 text-text">
                    <Wallet size={20} />
                    <span>Total Balance</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    ₹{stats.total_balance?.toLocaleString() || 0}
                </div>
            </div>

            <div className="flex gap-4">
                <div className="card flex-1">
                    <div className="flex items-center gap-2 text-success">
                        <TrendingUp size={20} />
                        <span>Income ({filter})</span>
                    </div>
                    <div className="text-xl mt-2">₹{stats.monthly_income?.toLocaleString() || 0}</div>
                </div>
                <div className="card flex-1">
                    <div className="flex items-center gap-2 text-danger">
                        <TrendingDown size={20} />
                        <span>Expense ({filter})</span>
                    </div>
                    <div className="text-xl mt-2">₹{stats.monthly_expense?.toLocaleString() || 0}</div>
                </div>
            </div>

            <h2 className="text-xl mt-4">Recent Transactions</h2>
            <div className="flex flex-col gap-2">
                {recentTransactions.map(t => (
                    <div key={t.id} className="card flex justify-between items-center" style={{ padding: '1rem' }}>
                        <div className="flex flex-col">
                            <span style={{ fontWeight: 500 }}>{t.note || 'Transaction'}</span>
                            <span className="text-sm text-muted">{new Date(t.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <span className={t.type === 'income' ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount}
                        </span>
                    </div>
                ))}
                {recentTransactions.length === 0 && (
                    <div className="text-muted text-center py-4">No recent transactions</div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
