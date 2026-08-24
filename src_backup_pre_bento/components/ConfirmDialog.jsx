import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-xl text-center">
        <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs text-gray-600 bg-gray-100 rounded-xl font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-xs text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium"
          >
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
}
