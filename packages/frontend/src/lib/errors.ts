import { AxiosError } from "axios";

interface ZodErrorItem {
  code: string;
  message: string;
  path: (string | number)[];
}

type ErrorResponse = {
  message?: string;
  error?: string | ZodErrorItem[];
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response?.status === 401) {
      if (axiosError.response?.data?.error === "Token não fornecido" || 
          axiosError.response?.data?.error === "Token inválido") {
        return "Sua sessão expirou. Por favor, faça login novamente.";
      }
      if (axiosError.response?.data?.error === "Não autenticado") {
        return "Você precisa estar logado para realizar esta ação.";
      }
      if (typeof axiosError.response?.data?.error === "string") {
        return axiosError.response.data.error;
      }
    }
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    const errorData = axiosError.response?.data?.error;
    
    if (errorData) {
      if (Array.isArray(errorData)) {
        return errorData
          .map((err: ZodErrorItem) => err.message)
          .join(". ");
      }
      
      if (typeof errorData === "string") {
        const friendlyMessages: Record<string, string> = {
          "Token inválido": "Sua sessão expirou. Por favor, faça login novamente.",
          "Token não fornecido": "Sua sessão expirou. Por favor, faça login novamente.",
          "Não autenticado": "Você precisa estar logado para realizar esta ação.",
        };
        return friendlyMessages[errorData] || errorData;
      }
    }
    
    if (axiosError.code === "ERR_NETWORK") {
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }
    
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function createErrorHandler(toast: (props: { variant: "destructive"; title: string; description: string }) => void) {
  return (error: unknown) => {
    toast({
      variant: "destructive",
      title: "Erro",
      description: getErrorMessage(error),
    });
  };
}

