import { Check, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: Option[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    maxHeight?: string;
    icon?: React.ReactNode;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    options,
    selectedValues,
    onChange,
    placeholder = '선택',
    searchPlaceholder = '검색...',
    className = '',
    maxHeight = '250px',
    icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Toggle selection of an option
    const toggleOption = (value: string) => {
        const isSelected = selectedValues.includes(value);
        if (isSelected) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    // Toggle all filtered options
    const toggleAll = () => {
        const filteredValues = filteredOptions.map(option => option.value);
        const allSelected = filteredValues.every(value => selectedValues.includes(value));

        if (allSelected) {
            // Deselect all filtered options
            onChange(selectedValues.filter(value => !filteredValues.includes(value)));
        } else {
            // Select all filtered options
            const newSelected = [...selectedValues];
            filteredValues.forEach(value => {
                if (!newSelected.includes(value)) {
                    newSelected.push(value);
                }
            });
            onChange(newSelected);
        }
    };

    // Get selected options labels for display
    const selectedLabels = selectedValues
        .map(value => options.find(option => option.value === value)?.label)
        .filter(Boolean);

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Dropdown trigger */}
            <div
                className={`flex items-center justify-between px-3 py-2 border rounded-lg bg-white cursor-pointer hover:border-blue-400 ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center flex-1 min-w-0">
                    {icon && <span className="mr-2">{icon}</span>}
                    {selectedValues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedValues.length <= 2 ? (
                                selectedLabels.map((label, index) => (
                                    <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                                        {label}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-700">{selectedValues.length}개 선택됨</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center">
                    {selectedValues.length > 0 && (
                        <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([]);
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <svg className={`ml-1 h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* Search box */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchTerm('');
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Select all option */}
                    <div className="p-2 border-b">
                        <button
                            type="button"
                            className="flex items-center w-full px-2 py-1 text-sm text-left hover:bg-gray-50 rounded"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleAll();
                            }}
                        >
                            <span className="mr-2 inline-block w-5 h-5 border rounded flex items-center justify-center">
                                {filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.includes(option.value)) && (
                                    <Check size={14} className="text-blue-500" />
                                )}
                            </span>
                            <span>
                                {filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.includes(option.value))
                                    ? '모두 선택 해제'
                                    : '모두 선택'}
                            </span>
                        </button>
                    </div>

                    {/* Options list */}
                    <div className={`overflow-y-auto p-2`} style={{ maxHeight }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className="flex items-center w-full px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(option.value);
                                    }}
                                >
                                    <span className={`mr-2 inline-block w-5 h-5 border rounded flex items-center justify-center ${selectedValues.includes(option.value) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                                        {selectedValues.includes(option.value) && (
                                            <Check size={14} className="text-blue-500" />
                                        )}
                                    </span>
                                    <span>{option.label}</span>
                                </button>
                            ))
                        ) : (
                            <div className="py-2 px-3 text-sm text-gray-500 text-center">
                                결과 없음
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}; 