import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, CreditCard, Wallet, Building2, Trash2 } from 'lucide-react';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'bank',
        balance: '',
        credit_limit: '',
        due_date: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts/');
            setAccounts(res.data);
        } catch (error) {
            console.error("Error fetching accounts", error);
            alert("Failed to fetch accounts. Please check if the backend is running.");
        }
    };

    const handleTypeChange = (type) => {
        let defaultName = '';
        if (type === 'cash') {
            defaultName = 'Cash';
        } else if (type === 'bank') {
            defaultName = 'Bank Account';
        } else if (type === 'credit') {
            defaultName = 'Credit Card';
        }
        setNewAccount({ ...newAccount, type, name: defaultName });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted, newAccount:', newAccount);

        try {
            const accountData = {
                name: newAccount.name,
                type: newAccount.type,
                balance: newAccount.type === 'credit' ? 0 : (parseFloat(newAccount.balance) || 0),
                credit_limit: newAccount.type === 'credit' ? (parseFloat(newAccount.credit_limit) || 0) : null,
                due_date: newAccount.type === 'credit' ? newAccount.due_date : null
            };

            console.log('Sending to API:', accountData);
            const response = await api.post('/accounts/', accountData);
            console.log('API Response:', response.data);

            setShowModal(false);
            await fetchAccounts();
            setNewAccount({ name: '', type: 'bank', balance: '', credit_limit: '', due_date: '' });
            alert('Account created successfully!');
        } catch (error) {
            console.error("Error creating account:", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to create account: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleDelete = async (accountId, accountName) => {
        if (!window.confirm(`Are you sure you want to delete "${accountName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await api.delete(`/accounts/${accountId}`);
            if (response.data.error) {
                alert(response.data.error);
            } else {
                alert('Account deleted successfully!');
                fetchAccounts();
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert(error.response?.data?.error || "Failed to delete account. It may have existing transactions.");
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
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-xl">₹{acc.balance.toLocaleString()}</div>
                                {acc.type === 'credit' && acc.credit_limit && (
                                    <div className="text-xs text-muted">Limit: ₹{acc.credit_limit.toLocaleString()}</div>
                                )}
                            </div>
                            <button
                                className="btn"
                                onClick={() => handleDelete(acc.id, acc.name)}
                                style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div className="text-center text-muted py-8">No accounts yet. Click + to add your first account.</div>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
                        <h2 className="text-xl mb-4">Add Account</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <select
                                className="input"
                                value={newAccount.type}
                                onChange={e => handleTypeChange(e.target.value)}
                            >
                                <option value="bank">Bank Account</option>
                                <option value="cash">Cash</option>
                                <option value="credit">Credit Card</option>
                            </select>

                            <input
                                className="input"
                                placeholder="Account Name"
                                value={newAccount.name}
                                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                required
                            />

                            {newAccount.type === 'credit' ? (
                                <>
                                    <input
                                        className="input"
                                        type="number"
                                        step="0.01"
                                        placeholder="Credit Limit"
                                        value={newAccount.credit_limit}
                                        onChange={e => setNewAccount({ ...newAccount, credit_limit: e.target.value })}
                                        required
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
                                    step="0.01"
                                    placeholder="Current Balance"
                                    value={newAccount.balance}
                                    onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                                    required
                                />
                            )}

                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ flex: 1, background: 'var(--background)' }}
                                    onClick={() => {
                                        setShowModal(false);
                                        setNewAccount({ name: '', type: 'bank', balance: '', credit_limit: '', due_date: '' });
                                    }}
                                >
                                    Cancel
                                </button>
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
