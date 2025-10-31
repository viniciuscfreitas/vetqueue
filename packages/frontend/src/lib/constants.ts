import { ServiceType } from "@/lib/api";

export const SERVICE_TYPE_OPTIONS = [
  { value: ServiceType.CONSULTA, label: "Consulta" },
  { value: ServiceType.VACINACAO, label: "Vacinação" },
  { value: ServiceType.CIRURGIA, label: "Cirurgia" },
  { value: ServiceType.EXAME, label: "Exame" },
  { value: ServiceType.BANHO_TOSA, label: "Banho e Tosa" },
] as const;

