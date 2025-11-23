import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, ArrowRight, Download } from 'lucide-react';
import { format, parseISO, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import PDFExportModal from '../components/PDFExportModal';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showPDFModal, setShowPDFModal] = useState(false);

    // Drill-down State
    const [viewMode, setViewMode] = useState('day'); // day, week, month, year, specific, range
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
    const [specificDate, setSpecificDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [rangeStart, setRangeStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [rangeEnd, setRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Form State
    const [activeTab, setActiveTab] = useState('expense');
    const [newTrans, setNewTrans] = useState({
        amount: '', type: 'expense', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        note: '', account_id: '', category_id: ''
    });
    const [newTransfer, setNewTransfer] = useState({
        source_account_id: '', target_account_id: '', amount: '', date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
    const [showCatInput, setShowCatInput] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', color: '#3357FF' });

    useEffect(() => {
        fetchData();
    }, [viewMode, selectedYear, selectedMonth, selectedWeekStart, specificDate, rangeStart, rangeEnd]);

    const fetchData = async () => {
        try {
            let start, end;

            if (viewMode === 'year') {
                start = startOfYear(new Date(selectedYear, 0, 1));
                end = endOfYear(new Date(selectedYear, 0, 1));
            } else if (viewMode === 'month') {
                start = startOfMonth(new Date(selectedYear, selectedMonth, 1));
                end = endOfMonth(new Date(selectedYear, selectedMonth, 1));
            } else if (viewMode === 'week') {
                start = startOfWeek(selectedWeekStart);
                end = endOfWeek(selectedWeekStart);
            } else if (viewMode === 'specific') {
                start = new Date(specificDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(specificDate);
                end.setHours(23, 59, 59, 999);
            } else if (viewMode === 'range') {
                start = new Date(rangeStart);
                start.setHours(0, 0, 0, 0);
                end = new Date(rangeEnd);
                end.setHours(23, 59, 59, 999);
            } else {
                // Day view
                start = new Date();
                start.setHours(0, 0, 0, 0);
                end = new Date();
                end.setHours(23, 59, 59, 999);
            }

            const [tRes, aRes, cRes] = await Promise.all([
                api.get(`/transactions/?start_date=${start.toISOString()}&end_date=${end.toISOString()}`),
                api.get('/accounts/'),
                api.get('/categories/')
            ]);
            setTransactions(tRes.data);
            setAccounts(aRes.data);
            setCategories(cRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'transfer') {
                await api.post('/transfers/', {
                    ...newTransfer,
                    amount: parseFloat(newTransfer.amount),
                    source_account_id: parseInt(newTransfer.source_account_id),
                    target_account_id: parseInt(newTransfer.target_account_id)
                });
            } else {
                await api.post('/transactions/', {
                    ...newTrans,
                    type: activeTab,
                    amount: parseFloat(newTrans.amount),
                    account_id: parseInt(newTrans.account_id),
                    category_id: parseInt(newTrans.category_id)
                });
            }
            setShowModal(false);
            fetchData();
            resetForms();
        } catch (error) {
            console.error("Error creating transaction", error);
        }
    };

    const resetForms = () => {
        setNewTrans({
            amount: '', type: 'expense', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            note: '', account_id: '', category_id: ''
        });
        setNewTransfer({
            source_account_id: '', target_account_id: '', amount: '', date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
    };

    const handleCreateCategory = async () => {
        try {
            const res = await api.post('/categories/', newCategory);
            setCategories([...categories, res.data]);
            setNewTrans({ ...newTrans, category_id: res.data.id });
            setShowCatInput(false);
            setNewCategory({ name: '', type: 'expense', color: '#3357FF' });
        } catch (error) {
            console.error("Error creating category", error);
        }
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="flex flex-col gap-4" style={{ paddingBottom: '80px' }}>
            <header className="flex justify-between items-center">
                <h1 className="text-2xl">Transactions</h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => setShowPDFModal(true)}>
                        <Download size={20} />
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            {/* Navigation */}
            <div className="card">
                <div className="flex gap-4 mb-4 border-b border-border pb-2" style={{ overflowX: 'auto' }}>
                    {['day', 'week', 'month', 'year', 'specific', 'range'].map(m => (
                        <button
                            key={m}
                            className={`text-sm font-bold ${viewMode === m ? 'text-primary' : 'text-muted'}`}
                            onClick={() => setViewMode(m)}
                            style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
                        >
                            {m === 'specific' ? 'Specific Date' : m === 'range' ? 'Date Range' : m}
                        </button>
                    ))}
                </div>

                {viewMode === 'year' && (
                    <div className="flex gap-2 flex-wrap">
                        {[2023, 2024, 2025].map(y => (
                            <button key={y} className={`btn ${selectedYear === y ? 'btn-primary' : ''}`} onClick={() => setSelectedYear(y)}>{y}</button>
                        ))}
                    </div>
                )}

                {viewMode === 'month' && (
                    <div className="flex gap-2 flex-wrap">
                        {months.map((m, i) => (
                            <button
                                key={m}
                                className={`btn ${selectedMonth === i ? 'btn-primary' : ''}`}
                                onClick={() => setSelectedMonth(i)}
                            >{m}</button>
                        ))}
                    </div>
                )}

                {viewMode === 'specific' && (
                    <div>
                        <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>Select Date</label>
                        <input
                            type="date"
                            className="input"
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                        />
                    </div>
                )}

                {viewMode === 'range' && (
                    <div className="flex gap-4 flex-wrap">
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>Start Date</label>
                            <input
                                type="date"
                                className="input"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>End Date</label>
                            <input
                                type="date"
                                className="input"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {transactions.map(t => {
                    const cat = categories.find(c => c.id === t.category_id);
                    const acc = accounts.find(a => a.id === t.account_id);
                    const isTransfer = t.type === 'transfer';

                    return (
                        <div key={t.id} className="card flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: isTransfer ? 'var(--text-muted)' : (cat?.color || '#333'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff'
                                }}>
                                    {isTransfer ? <ArrowRight size={20} /> : <span style={{ fontSize: '1.2rem' }}>{cat?.name?.[0]}</span>}
                                </div>
                                <div>
                                    <div className="font-bold">{isTransfer ? 'Transfer' : cat?.name}</div>
                                    <div className="text-sm text-muted">{format(parseISO(t.date), 'dd-MM-yyyy h:mm a')}</div>
                                    {t.note && <div className="text-xs text-muted">{t.note}</div>}
                                </div>
                            </div>
                            <div className={`font-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                {t.type === 'income' ? '+' : '-'}₹{t.amount}
                            </div>
                        </div>
                    );
                })}
                {transactions.length === 0 && (
                    <div className="text-center text-muted py-8">No transactions found for this period.</div>
                )}
            </div>

            {/* PDF Export Modal */}
            <PDFExportModal isOpen={showPDFModal} onClose={() => setShowPDFModal(false)} />

            {/* Add Transaction Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 className="text-xl mb-4">Add Transaction</h2>

                        <div className="flex gap-2 mb-4">
                            {['expense', 'income', 'transfer'].map(type => (
                                <button
                                    key={type}
                                    className={`btn ${activeTab === type ? 'btn-primary' : ''}`}
                                    style={{ flex: 1, textTransform: 'capitalize', border: activeTab !== type ? '1px solid var(--border)' : 'none' }}
                                    onClick={() => setActiveTab(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleCreateTransaction} className="flex flex-col gap-4">
                            {activeTab === 'transfer' ? (
                                <>
                                    <select
                                        className="input"
                                        value={newTransfer.source_account_id}
                                        onChange={e => setNewTransfer({ ...newTransfer, source_account_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Source Account</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₹{a.balance})</option>)}
                                    </select>
                                    <select
                                        className="input"
                                        value={newTransfer.target_account_id}
                                        onChange={e => setNewTransfer({ ...newTransfer, target_account_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Target Account</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance})</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="Amount"
                                        value={newTransfer.amount}
                                        onChange={e => setNewTransfer({ ...newTransfer, amount: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={newTransfer.date}
                                        onChange={e => setNewTransfer({ ...newTransfer, date: e.target.value })}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="Amount"
                                            value={newTrans.amount}
                                            onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <select
                                        className="input"
                                        value={newTrans.account_id}
                                        onChange={e => setNewTrans({ ...newTrans, account_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>

                                    <div className="flex gap-2">
                                        <select
                                            className="input"
                                            value={newTrans.category_id}
                                            onChange={e => setNewTrans({ ...newTrans, category_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.filter(c => c.type === activeTab).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" className="btn" onClick={() => setShowCatInput(!showCatInput)}>+</button>
                                    </div>

                                    {showCatInput && (
                                        <div className="flex gap-2 p-2 border border-border rounded">
                                            <input
                                                className="input"
                                                placeholder="New Category Name"
                                                value={newCategory.name}
                                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value, type: activeTab })}
                                            />
                                            <input
                                                type="color"
                                                value={newCategory.color}
                                                onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                                                style={{ height: '40px' }}
                                            />
                                            <button type="button" className="btn btn-primary" onClick={handleCreateCategory}>Add</button>
                                        </div>
                                    )}

                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={newTrans.date}
                                        onChange={e => setNewTrans({ ...newTrans, date: e.target.value })}
                                        required
                                    />
                                    <input
                                        className="input"
                                        placeholder="Note (optional)"
                                        value={newTrans.note}
                                        onChange={e => setNewTrans({ ...newTrans, note: e.target.value })}
                                    />
                                </>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
