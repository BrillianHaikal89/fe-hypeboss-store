"use client";

import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  showImageOption?: boolean;
  deleteWithImage?: boolean;
  onImageOptionChange?: (value: boolean) => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  showImageOption = true,
  deleteWithImage = false,
  onImageOptionChange,
}: DeleteConfirmationModalProps) {
  const [localDeleteImage, setLocalDeleteImage] = useState(deleteWithImage);

  useEffect(() => {
    setLocalDeleteImage(deleteWithImage);
  }, [deleteWithImage]);

  const handleImageOptionChange = (value: boolean) => {
    setLocalDeleteImage(value);
    if (onImageOptionChange) {
      onImageOptionChange(value);
    }
  };

  const handleConfirm = () => {
    if (showImageOption && onImageOptionChange) {
      onImageOptionChange(localDeleteImage);
    }
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay dengan opacity lebih rendah */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-700" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                {title}
              </h3>
              
              <p className="text-gray-900 font-medium text-center mb-6">
                {message}
              </p>

              {/* Pilihan untuk hapus gambar */}
              {showImageOption && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={localDeleteImage}
                      onChange={(e) => handleImageOptionChange(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-900 font-medium">
                      Hapus juga gambar produk dari server
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 mt-2">
                    Jika dicentang, gambar akan dihapus permanen dari penyimpanan.
                    Jika tidak dicentang, hanya data produk yang dihapus (gambar tetap ada di server).
                  </p>
                </div>
              )}
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  {title.includes("Hapus") ? "Hapus Permanen" : "Nonaktifkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}