import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Reports = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const reportRef = useRef();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, cRes, trendRes] = await Promise.all([
                api.get('/transactions/'),
                api.get('/categories/'),
                api.get('/reports/trend')
            ]);
            setTransactions(tRes.data);
            setCategories(cRes.data);
            setTrendData(trendRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const downloadPDF = async () => {
        const element = reportRef.current;

        // Temporarily set background to white for capture
        const originalBg = element.style.background;
        element.style.background = '#ffffff';
        element.style.color = '#000000';

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const data = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Header
            pdf.setFontSize(22);
            pdf.setTextColor(40, 40, 40);
            pdf.text("BudgetBuddy Report", 10, 15);

            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 22);

            const imgProperties = pdf.getImageProperties(data);
            const imgHeight = (imgProperties.height * (pdfWidth - 20)) / imgProperties.width;

            pdf.addImage(data, 'PNG', 10, 30, pdfWidth - 20, imgHeight);
            pdf.save(`BudgetBuddy_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            alert("Report downloaded successfully!");
        } catch (error) {
            console.error("PDF Generation Error", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            // Restore styles
            element.style.background = originalBg;
            element.style.color = '';
        }
    };

    // Process data for charts
    const expenseData = categories
        .filter(c => c.type === 'expense')
        .map(cat => {
            const total = transactions
                .filter(t => t.category_id === cat.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, value: total, color: cat.color };
        })
        .filter(d => d.value > 0);

    return (
        <div className="flex flex-col gap-4" style={{ paddingBottom: '80px' }}>
            <header className="flex justify-between items-center">
                <h1 className="text-2xl">Reports</h1>
                <button className="btn btn-primary" onClick={downloadPDF}>
                    <Download size={20} className="mr-2" /> Download PDF
                </button>
            </header>

            <div ref={reportRef} className="flex flex-col gap-4" style={{ background: 'var(--background)', padding: '1rem' }}>
                <div className="card">
                    <h2 className="text-xl mb-4">Spending by Category</h2>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-xl mb-4">Monthly Trends</h2>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="period" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip cursor={{ fill: 'var(--surface)' }} contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }} />
                                <Legend />
                                <Bar dataKey="income" fill="var(--success)" radius={[4, 4, 0, 0]} name="Income" />
                                <Bar dataKey="expense" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Expense" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
