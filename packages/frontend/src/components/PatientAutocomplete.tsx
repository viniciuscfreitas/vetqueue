"use client";

import { Patient, patientApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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

const MAX_RESULTS = 8;
const MIN_SEARCH_LENGTH = 2;

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
  const trimmedTutorName = tutorName.trim();
  const trimmedDebouncedSearch = debouncedSearch.trim();
  const canFetch = trimmedTutorName.length > 0 && trimmedDebouncedSearch.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value);
    }
    if (!trimmedTutorName) {
      setSelectedPatient(null);
      setSearchTerm("");
    }
  }, [value, tutorName, trimmedTutorName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: patients = [], isFetching } = useQuery({
    queryKey: ["patients", "search", trimmedTutorName, canFetch ? trimmedDebouncedSearch : ""],
    queryFn: () =>
      patientApi
        .list({
          tutorName: trimmedTutorName,
          name: trimmedDebouncedSearch,
          limit: MAX_RESULTS,
        })
        .then((res) => res.data),
    enabled: canFetch,
    staleTime: 30_000,
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(newValue.trim().length > 0 && trimmedTutorName.length > 0);

    if (selectedPatient && newValue !== selectedPatient.name) {
      setSelectedPatient(null);
      onChange(null);
      onPatientNameChange?.(newValue);
    } else if (!selectedPatient) {
      onPatientNameChange?.(newValue);
    }
  };

  const displayValue = selectedPatient ? selectedPatient.name : searchTerm;
  const trimmedSearchTerm = searchTerm.trim();
  const visiblePatients = trimmedSearchTerm.length >= MIN_SEARCH_LENGTH ? patients : [];

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
        onFocus={() => setShowDropdown(searchTerm.trim().length > 0 && trimmedTutorName.length > 0)}
        disabled={!trimmedTutorName}
        placeholder={placeholder}
        required={required}
        className="w-full"
        autoComplete="off"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {!trimmedTutorName ? (
            <div className="p-2 text-sm text-muted-foreground">
              Informe o tutor para buscar pacientes
            </div>
          ) : trimmedSearchTerm.length < MIN_SEARCH_LENGTH ? (
            <div className="p-2 text-sm text-muted-foreground">
              Digite pelo menos {MIN_SEARCH_LENGTH} caracteres para buscar
            </div>
          ) : isFetching ? (
            <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
          ) : visiblePatients.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum paciente encontrado
            </div>
          ) : (
            visiblePatients.map((patient) => (
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

