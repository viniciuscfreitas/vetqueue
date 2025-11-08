"use client";

import { Tutor, tutorApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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

const MAX_RESULTS = 8;
const MIN_SEARCH_LENGTH = 2;

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

  const trimmedDebouncedSearch = debouncedSearch.trim();
  const canFetch = trimmedDebouncedSearch.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value);
      setSelectedTutor(null);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: tutors = [], isFetching } = useQuery({
    queryKey: ["tutors", "search", canFetch ? trimmedDebouncedSearch : ""],
    queryFn: async () => {
      try {
        const response = await tutorApi.list({
          search: trimmedDebouncedSearch.replace(/\s+/g, " "),
          limit: MAX_RESULTS,
        });
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar tutores", error);
        return [];
      }
    },
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

  const handleSelect = (tutor: Tutor) => {
    setSelectedTutor({ id: tutor.id, name: tutor.name });
    setSearchTerm(tutor.name);
    setShowDropdown(false);
    onChange(tutor.name, tutor.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(newValue.trim().length > 0);
    setSelectedTutor(null);
    onChange(newValue, undefined);
  };

  const trimmedSearchTerm = searchTerm.trim();
  const shouldShowResults = showDropdown && trimmedSearchTerm.length > 0;
  const hasEnoughCharacters = trimmedSearchTerm.length >= MIN_SEARCH_LENGTH;
  const visibleTutors = hasEnoughCharacters ? tutors : [];

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
        onFocus={() => setShowDropdown(searchTerm.trim().length > 0)}
        placeholder={placeholder}
        required={required}
        className="w-full"
        autoComplete="off"
      />
      {shouldShowResults && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {!hasEnoughCharacters ? (
            <div className="p-2 text-sm text-muted-foreground">
              Digite pelo menos {MIN_SEARCH_LENGTH} caracteres para buscar
            </div>
          ) : isFetching ? (
            <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
          ) : visibleTutors.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum tutor encontrado
            </div>
          ) : (
            visibleTutors.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                onClick={() => handleSelect(tutor)}
                className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tutor.name}</span>
                  {(tutor.phone || tutor.cpfCnpj) && (
                    <span className="text-xs text-muted-foreground">
                      {[tutor.phone, tutor.cpfCnpj].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

