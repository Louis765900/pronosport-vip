// src/components/charts/BankrollChart.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BankrollEntry {
    date: string;
    bankroll: number;
}

const BankrollChart = () => {
    const [data, setData] = useState<BankrollEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBankrollData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/stats/bankroll');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result: BankrollEntry[] = await response.json();
                setData(result);
            } catch (err) {
                console.error("Failed to fetch bankroll data:", err);
                setError("Impossible de charger les données de la bankroll.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankrollData();
    }, []);

    if (isLoading) {
        return <div className="text-center text-gray-400 py-8">Chargement du graphique de la bankroll...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-8">{error}</div>;
    }

    if (data.length === 0) {
        return <div className="text-center text-gray-400 py-8">Pas encore de données de bankroll disponibles.</div>;
    }

    return (
        <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-900 p-4 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2 text-center">Évolution de la Bankroll</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /> {/* Darker grid lines */}
                    <XAxis dataKey="date" stroke="#a0aec0" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', borderRadius: '6px', color: '#cbd5e0' }}
                        labelStyle={{ color: '#a0aec0', fontWeight: 'bold' }}
                        formatter={(value: number | undefined, name: string) => [value ? value.toFixed(2) + '€' : 'N/A', name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line 
                        type="monotone" 
                        dataKey="bankroll" 
                        name="Bankroll" 
                        stroke="#48bb78" // Green line
                        strokeWidth={2}
                        activeDot={{ r: 8, fill: '#48bb78' }} 
                        dot={{ r: 4, fill: '#48bb78' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BankrollChart;
