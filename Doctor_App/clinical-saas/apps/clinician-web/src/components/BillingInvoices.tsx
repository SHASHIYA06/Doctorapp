import React from 'react';
import { ArrowLeft } from 'lucide-react';
export function BillingInvoices({ patientId, onBack }: any) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
      <h1 className="text-3xl font-bold">Billing & Invoices</h1>
      <p className="text-gray-600 mt-2">Patient ID: {patientId || 'All Invoices'}</p>
    </div>
  );
}
