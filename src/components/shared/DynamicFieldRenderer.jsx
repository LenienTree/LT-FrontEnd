import React from 'react';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';

const DynamicFieldRenderer = ({
  fields = [],
  values = {},
  onChange,
  onFileUpload,
  disabled = false,
  uploadingFields = {}
}) => {
  if (!fields || fields.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm border border-dashed border-[#1a4d4d] rounded-xl">
        No custom fields defined for this submission.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const value = values[field.id] || '';
        const isUploading = !!uploadingFields[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-semibold text-white">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}

            {/* Short Text */}
            {field.type === 'text' && (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                required={field.required}
                className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
              />
            )}

            {/* Long Text / Textarea */}
            {field.type === 'textarea' && (
              <textarea
                rows={4}
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                required={field.required}
                className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
              />
            )}

            {/* Number */}
            {field.type === 'number' && (
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                required={field.required}
                className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
              />
            )}

            {/* URL */}
            {field.type === 'url' && (
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || 'https://...'}
                disabled={disabled}
                required={field.required}
                className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
              />
            )}

            {/* Dropdown Select */}
            {field.type === 'select' && (
              <select
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                disabled={disabled}
                required={field.required}
                className="w-full bg-[#0c1e1e] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
              >
                <option value="">Select an option...</option>
                {Array.isArray(field.options) &&
                  field.options.map((opt, i) => (
                    <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                      {typeof opt === 'string' ? opt : opt.label}
                    </option>
                  ))}
              </select>
            )}

            {/* File Upload */}
            {field.type === 'file' && (
              <div className="space-y-2">
                {value ? (
                  <div className="flex items-center justify-between p-3 bg-[#142929] border border-[#00ff88]/30 rounded-xl text-sm">
                    <div className="flex items-center gap-2 text-[#00ff88] truncate">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <a href={value} target="_blank" rel="noopener noreferrer" className="underline truncate">
                        Uploaded File Link
                      </a>
                    </div>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onChange(field.id, '')}
                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id={`file_${field.id}`}
                      disabled={disabled || isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onFileUpload) {
                          onFileUpload(field.id, file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor={`file_${field.id}`}
                      className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#1a4d4d] hover:border-[#00ff88] rounded-xl text-sm text-gray-300 cursor-pointer transition-all ${
                        disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" /> Uploading to S3...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#00ff88]" /> Click to select file for upload
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFieldRenderer;
