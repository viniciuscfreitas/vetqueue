"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { patientApi } from "@/lib/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface TutorAutocompleteProps {
  value?: string;
  onChange: (tutorName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function TutorAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Buscar tutor...",
  required = false,
  id = "tutorAutocomplete",
}: TutorAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value);
      setSelectedTutor(null);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", "tutors", debouncedSearch],
    queryFn: () => {
      if (!debouncedSearch.trim()) {
        return Promise.resolve([]);
      }
      return patientApi.list({ tutorName: debouncedSearch }).then((res) => res.data);
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  const uniqueTutors = Array.from(
    new Set(patients.map(p => p.tutorName).filter(Boolean))
  ).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (tutorName: string) => {
    setSelectedTutor(tutorName);
    setSearchTerm(tutorName);
    setShowDropdown(false);
    onChange(tutorName);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(newValue.length > 0);
    setSelectedTutor(null);
    onChange(newValue);
  };

  return (
    <div className="relative space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(searchTerm.length > 0 && uniqueTutors.length > 0)}
        placeholder={placeholder}
        required={required}
        className="w-full"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
          ) : uniqueTutors.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum tutor encontrado
            </div>
          ) : (
            uniqueTutors.map((tutorName, index) => (
              <button
                key={`${tutorName}-${index}`}
                type="button"
                onClick={() => handleSelect(tutorName)}
                className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              >
                {tutorName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

