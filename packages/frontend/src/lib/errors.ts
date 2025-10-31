import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
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

