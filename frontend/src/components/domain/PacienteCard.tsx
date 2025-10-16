import { Megaphone, Check } from 'lucide-react';
import { Paciente } from '../../types';
import { Card, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from './StatusBadge';

interface PacienteCardProps {
  paciente: Paciente;
  onChamar: (id: string) => void;
  onFinalizar: (id: string) => void;
}

const PacienteCard = ({ 
    paciente, 
    onChamar, 
    onFinalizar 
}: PacienteCardProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-title-1 text-primary">{paciente.nome_pet}</CardTitle>
                <p className="text-meta mt-1">{paciente.nome_tutor}</p>
            </div>
            <StatusBadge status={paciente.status} />
        </div>
        {paciente.status === 'Em Atendimento' && paciente.sala_atendimento && (
            <p className="text-small font-semibold text-semantic-success pt-2">
                Em: {paciente.sala_atendimento}
            </p>
        )}
      </CardHeader>
      <CardFooter>
        <div className="flex w-full justify-end space-x-2">
          {paciente.status === 'Aguardando' && (
            <Button className="bg-semantic-success hover:opacity-90" onClick={() => onChamar(paciente.id)}>
              <Megaphone className="mr-2 h-4 w-4" /> Chamar
            </Button>
          )}
          {paciente.status === 'Em Atendimento' && (
            <Button className="bg-semantic-danger hover:opacity-90" onClick={() => onFinalizar(paciente.id)}>
              <Check className="mr-2 h-4 w-4" /> Finalizar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export { PacienteCard };
