"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { patientApi, Patient } from "@/lib/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PatientAutocompleteProps {
  tutorName: string;
  value?: string;
  onChange: (patient: Patient | null) => void;
  onPatientNameChange?: (name: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function PatientAutocomplete({
  tutorName,
  value,
  onChange,
  onPatientNameChange,
  label,
  placeholder = "Buscar pet...",
  required = false,
  id = "patientAutocomplete",
}: PatientAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value);
    }
    if (!tutorName.trim()) {
      setSelectedPatient(null);
      setSearchTerm("");
    }
  }, [value, tutorName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", "search", tutorName, debouncedSearch],
    queryFn: () => {
      if (!debouncedSearch.trim() || !tutorName.trim()) {
        return Promise.resolve([]);
      }
      return patientApi.list({ 
        tutorName: tutorName.trim(),
        name: debouncedSearch.trim()
      }).then((res) => res.data);
    },
    enabled: debouncedSearch.trim().length > 0 && tutorName.trim().length > 0,
  });

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

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.name);
    setShowDropdown(false);
    onChange(patient);
    onPatientNameChange?.(patient.name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(newValue.length > 0 && tutorName.trim().length > 0);
    
    if (selectedPatient && newValue !== selectedPatient.name) {
      setSelectedPatient(null);
      onChange(null);
    }
    
    onPatientNameChange?.(newValue);
  };

  const displayValue = selectedPatient ? selectedPatient.name : searchTerm;

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
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(searchTerm.length > 0 && patients.length > 0 && tutorName.trim().length > 0)}
        disabled={!tutorName.trim()}
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
          ) : patients.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum paciente encontrado
            </div>
          ) : (
            patients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelect(patient)}
                className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              >
                {patient.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

