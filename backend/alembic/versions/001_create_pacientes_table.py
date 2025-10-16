"""Create pacientes table

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for StatusPaciente
    status_enum = postgresql.ENUM('AGUARDANDO', 'EM_ATENDIMENTO', name='statuspaciente')
    status_enum.create(op.get_bind())
    
    # Create pacientes table
    op.create_table('pacientes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('nome_pet', sa.String(length=255), nullable=False),
        sa.Column('nome_tutor', sa.String(length=255), nullable=False),
        sa.Column('status', status_enum, nullable=False),
        sa.Column('sala_atendimento', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop table
    op.drop_table('pacientes')
    
    # Drop enum type
    status_enum = postgresql.ENUM('AGUARDANDO', 'EM_ATENDIMENTO', name='statuspaciente')
    status_enum.drop(op.get_bind())
