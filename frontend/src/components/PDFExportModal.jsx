import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import api from '../services/api';

const PDFExportModal = ({ isOpen, onClose }) => {
    const [exportType, setExportType] = useState('today');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            let start, end;
            const now = new Date();

            switch (exportType) {
                case 'today':
                    start = new Date(now.setHours(0, 0, 0, 0));
                    end = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    start = new Date(now);
                    start.setDate(now.getDate() - now.getDay());
                    start.setHours(0, 0, 0, 0);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case 'year':
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                case 'custom':
                    start = new Date(startDate);
                    end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    break;
                default:
                    start = new Date(now.setHours(0, 0, 0, 0));
                    end = new Date(now.setHours(23, 59, 59, 999));
            }

            const [transRes, accountsRes, categoriesRes] = await Promise.all([
                api.get(`/transactions/?start_date=${start.toISOString()}&end_date=${end.toISOString()}`),
                api.get('/accounts/'),
                api.get('/categories/')
            ]);

            const transactions = transRes.data;
            const accounts = accountsRes.data;
            const categories = categoriesRes.data;

            // Generate PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            let yPos = 15;

            // Header
            pdf.setFontSize(20);
            pdf.setTextColor(40, 40, 40);
            pdf.text('BudgetBuddy', margin, yPos);

            yPos += 7;
            pdf.setFontSize(14);
            pdf.text('Transaction Report', margin, yPos);

            yPos += 7;
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Period: ${format(start, 'dd-MM-yyyy')} - ${format(end, 'dd-MM-yyyy')}`, margin, yPos);

            yPos += 5;
            pdf.text(`Generated: ${format(new Date(), 'dd-MM-yyyy h:mm a')}`, margin, yPos);

            yPos += 10;

            // Summary
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const netBalance = totalIncome - totalExpense;

            pdf.setFontSize(11);
            pdf.setTextColor(40, 40, 40);
            pdf.text(`Total Income: Rs. ${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
            yPos += 6;
            pdf.text(`Total Expense: Rs. ${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
            yPos += 6;
            pdf.text(`Net: Rs. ${netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);

            yPos += 10;

            // Transactions Table
            pdf.setFontSize(12);
            pdf.text('Transactions', margin, yPos);
            yPos += 7;

            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);

            // Table headers
            pdf.text('Date', margin, yPos);
            pdf.text('Category', margin + 30, yPos);
            pdf.text('Account', margin + 70, yPos);
            pdf.text('Note', margin + 110, yPos);
            pdf.text('Amount', margin + 160, yPos);

            yPos += 5;
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;

            // Transaction rows - Sort earliest to latest
            const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
            sortedTransactions.forEach((t, index) => {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = 15;
                }

                const cat = categories.find(c => c.id === t.category_id);
                const acc = accounts.find(a => a.id === t.account_id);

                pdf.setTextColor(40, 40, 40);
                pdf.text(format(new Date(t.date), 'dd-MM-yyyy'), margin, yPos);
                pdf.text(t.type === 'transfer' ? 'Transfer' : (cat?.name || 'N/A'), margin + 30, yPos);
                pdf.text(acc?.name || 'N/A', margin + 70, yPos);
                pdf.text((t.note || '').substring(0, 20), margin + 110, yPos);

                const amountText = `${t.type === 'income' ? '+' : '-'}Rs. ${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (t.type === 'income') {
                    pdf.setTextColor(16, 185, 129);
                } else {
                    pdf.setTextColor(239, 68, 68);
                }
                pdf.text(amountText, margin + 160, yPos);

                yPos += 6;
            });

            if (transactions.length === 0) {
                pdf.setTextColor(100, 100, 100);
                pdf.text('No transactions found for this period.', margin, yPos);
            }

            const filename = `BudgetBuddy_Transactions_${format(start, 'dd-MM-yyyy')}_to_${format(end, 'dd-MM-yyyy')}.pdf`;
            pdf.save(filename);

            alert('PDF downloaded successfully!');
            onClose();
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl">Export Transactions PDF</h2>
                    <button onClick={onClose} className="btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>Select Period</label>
                        <select
                            className="input"
                            value={exportType}
                            onChange={(e) => setExportType(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {exportType === 'custom' && (
                        <>
                            <div>
                                <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>Start Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>End Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button onClick={onClose} className="btn" style={{ flex: 1 }}>Cancel</button>
                        <button
                            onClick={handleExport}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            <Download size={20} className="mr-2" />
                            {loading ? 'Generating...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFExportModal;
