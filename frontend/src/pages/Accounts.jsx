import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, CreditCard, Wallet, Building2 } from 'lucide-react';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', balance: 0, credit_limit: 0, due_date: '' });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts/');
            setAccounts(res.data);
        } catch (error) {
            console.error("Error fetching accounts", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounts/', newAccount);
            setShowModal(false);
            fetchAccounts();
            setNewAccount({ name: '', type: 'bank', balance: 0, credit_limit: 0, due_date: '' });
        } catch (error) {
            console.error("Error creating account", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'cash': return <Wallet className="text-success" />;
            case 'credit': return <CreditCard className="text-secondary" />;
            default: return <Building2 className="text-primary" />;
        }
    };

    return (
        <div className="flex flex-col gap-4" style={{ paddingBottom: '80px' }}>
            <header className="flex justify-between items-center">
                <h1 className="text-2xl">Accounts</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                </button>
            </header>

            <div className="flex flex-col gap-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="card flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '50%' }}>
                                {getIcon(acc.type)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{acc.name}</div>
                                <div className="text-sm text-muted capitalize">{acc.type}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl">₹{acc.balance.toLocaleString()}</div>
                            {acc.type === 'credit' && (
                                <div className="text-xs text-muted">Limit: ₹{acc.credit_limit}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
                        <h2 className="text-xl mb-4">Add Account</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                className="input"
                                placeholder="Account Name"
                                value={newAccount.name}
                                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                required
                            />
                            <select
                                className="input"
                                value={newAccount.type}
                                onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                            >
                                <option value="bank">Bank Account</option>
                                <option value="cash">Cash</option>
                                <option value="credit">Credit Card</option>
                            </select>

                            {newAccount.type === 'credit' ? (
                                <>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="Credit Limit"
                                        value={newAccount.credit_limit}
                                        onChange={e => setNewAccount({ ...newAccount, credit_limit: parseFloat(e.target.value) })}
                                    />
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="Due Date (e.g. 10th)"
                                        value={newAccount.due_date}
                                        onChange={e => setNewAccount({ ...newAccount, due_date: e.target.value })}
                                    />
                                </>
                            ) : (
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="Current Balance"
                                    value={newAccount.balance}
                                    onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                                    required
                                />
                            )}

                            <div className="flex gap-2 mt-2">
                                <button type="button" className="btn" style={{ flex: 1, background: 'var(--background)' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
