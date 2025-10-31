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
        return errorData;
      }
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

