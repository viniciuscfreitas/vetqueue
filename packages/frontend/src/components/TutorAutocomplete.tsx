"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { tutorApi, Tutor } from "@/lib/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface TutorAutocompleteProps {
  value?: string;
  onChange: (tutorName: string, tutorId?: string) => void;
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
  const [selectedTutor, setSelectedTutor] = useState<{ id: string; name: string } | null>(null);
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

  const { data: allTutors = [], isLoading } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => tutorApi.list().then((res) => res.data),
  });

  const filteredTutors = debouncedSearch.trim()
    ? allTutors.filter(tutor =>
        tutor.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tutor.phone?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tutor.cpfCnpj?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 8)
    : [];

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

  const handleSelect = (tutor: Tutor) => {
    setSelectedTutor({ id: tutor.id, name: tutor.name });
    setSearchTerm(tutor.name);
    setShowDropdown(false);
    onChange(tutor.name, tutor.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(newValue.length > 0);
    setSelectedTutor(null);
    onChange(newValue, undefined);
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
        onFocus={() => setShowDropdown(searchTerm.length > 0 && filteredTutors.length > 0)}
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
          ) : filteredTutors.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum tutor encontrado
            </div>
          ) : (
            filteredTutors.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                onClick={() => handleSelect(tutor)}
                className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              >
                {tutor.name}
                {tutor.phone && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {tutor.phone}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

