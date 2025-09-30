# Portal WPS - Sistema de Agendamento de Carga

**Desenvolvido por:** Manus AI  
**Data:** 29 de Setembro de 2025  
**Versão:** 1.0.0

## Visão Geral

O **Portal WPS** é um sistema completo de agendamento logístico desenvolvido para facilitar a gestão de cargas entre fornecedores e clientes. O sistema oferece duas visões distintas: uma para administradores (clientes) e outra para fornecedores, proporcionando controle total sobre o processo de agendamento, check-in e check-out de veículos.

## Arquitetura do Sistema

### Tecnologias Utilizadas

| Componente | Tecnologia | Versão |
|------------|------------|---------|
| **Backend** | Flask (Python) | 3.11.0 |
| **Frontend** | React + Vite | 18.x |
| **Banco de Dados** | SQLite | 3.x |
| **Autenticação** | JWT (JSON Web Tokens) | - |
| **UI Framework** | Tailwind CSS + shadcn/ui | - |
| **Ícones** | Lucide React | - |

### Estrutura do Projeto

```
portal_wps/
├── portal_wps_backend/          # Aplicação Flask
│   ├── src/
│   │   ├── main.py             # Aplicação principal
│   │   ├── models/             # Modelos de dados
│   │   │   ├── user.py         # Modelo de usuário
│   │   │   ├── supplier.py     # Modelo de fornecedor
│   │   │   └── appointment.py  # Modelo de agendamento
│   │   └── routes/             # Rotas da API
│   │       ├── auth.py         # Autenticação
│   │       ├── admin.py        # Rotas administrativas
│   │       └── supplier.py     # Rotas do fornecedor
│   ├── database.db             # Banco de dados SQLite
│   └── requirements.txt        # Dependências Python
└── portal_wps_frontend/         # Aplicação React
    ├── src/
    │   ├── components/         # Componentes React
    │   ├── lib/               # Utilitários e API
    │   └── App.jsx            # Componente principal
    └── package.json           # Dependências Node.js
```

## Funcionalidades Principais

### 1. Sistema de Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação segura, diferenciando entre dois tipos de usuários:

- **Administrador**: Acesso completo ao sistema
- **Fornecedor**: Acesso restrito aos próprios agendamentos

### 2. Visão Administrador

#### Gestão de Fornecedores
- **Cadastro automático**: Criação simultânea de fornecedor e usuário de acesso
- **Validação de CNPJ**: Formatação e validação automática
- **Geração de senha temporária**: Sistema seguro de primeira autenticação
- **Listagem completa**: Visualização de todos os fornecedores cadastrados

#### Gestão de Agendamentos
- **Visualização semanal**: Interface calendário com navegação por semanas
- **Estatísticas em tempo real**: Contadores de agendamentos por status
- **Edição de agendamentos**: Modificação de dados pelos administradores
- **Sistema de check-in/check-out**: Controle de entrada e saída de veículos

#### Integração ERP
Quando um check-in é realizado, o sistema gera automaticamente um **payload JSON** para integração com sistemas ERP externos:

```json
{
  "appointment_id": 1,
  "supplier_cnpj": "12.345.678/0001-90",
  "supplier_name": "Fornecedor ABC Ltda",
  "purchase_order": "PO-2025-001",
  "truck_plate": "ABC-1234",
  "driver_name": "João Silva",
  "scheduled_date": "2025-09-29",
  "scheduled_time": "09:00:00",
  "check_in_time": "2025-09-29T15:04:07.192193",
  "check_out_time": null,
  "status": "checked_in",
  "timestamp": "2025-09-29T15:04:07.199018"
}
```

### 3. Visão Fornecedor

#### Gestão de Agendamentos Próprios
- **Visualização semanal**: Calendário com agendamentos do fornecedor
- **Criação de agendamentos**: Formulário completo para novos agendamentos
- **Edição de agendamentos**: Modificação de agendamentos existentes
- **Validação de disponibilidade**: Verificação automática de horários disponíveis

#### Campos do Agendamento
- **Data e Hora**: Seleção de data e horário
- **Pedido de Compra**: Número do PO
- **Placa do Caminhão**: Identificação do veículo
- **Nome do Motorista**: Responsável pela entrega

## API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/login` | Autenticação de usuário |

### Administrador
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/suppliers` | Listar fornecedores |
| POST | `/api/admin/suppliers` | Criar fornecedor |
| GET | `/api/admin/appointments` | Listar agendamentos |
| PUT | `/api/admin/appointments/{id}` | Editar agendamento |
| POST | `/api/admin/appointments/{id}/check-in` | Realizar check-in |
| POST | `/api/admin/appointments/{id}/check-out` | Realizar check-out |

### Fornecedor
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/supplier/appointments` | Listar agendamentos próprios |
| POST | `/api/supplier/appointments` | Criar agendamento |
| PUT | `/api/supplier/appointments/{id}` | Editar agendamento próprio |
| DELETE | `/api/supplier/appointments/{id}` | Cancelar agendamento |

## Modelo de Dados

### Usuário (User)
```python
{
  "id": Integer,
  "email": String,
  "password_hash": String,
  "role": String,  # "admin" ou "supplier"
  "supplier_id": Integer  # Referência ao fornecedor
}
```

### Fornecedor (Supplier)
```python
{
  "id": Integer,
  "cnpj": String,
  "description": String,
  "created_at": DateTime
}
```

### Agendamento (Appointment)
```python
{
  "id": Integer,
  "supplier_id": Integer,
  "date": Date,
  "time": Time,
  "purchase_order": String,
  "truck_plate": String,
  "driver_name": String,
  "status": String,  # "scheduled", "checked_in", "checked_out"
  "check_in_time": DateTime,
  "check_out_time": DateTime,
  "created_at": DateTime,
  "updated_at": DateTime
}
```

## Fluxo de Trabalho

### 1. Cadastro de Fornecedor (Administrador)
1. Administrador acessa a aba "Fornecedores"
2. Clica em "Novo Fornecedor"
3. Preenche CNPJ, descrição e email
4. Sistema cria fornecedor e usuário automaticamente
5. Senha temporária é gerada e exibida

### 2. Criação de Agendamento (Fornecedor)
1. Fornecedor faz login no sistema
2. Visualiza calendário semanal
3. Clica em "Novo Agendamento"
4. Preenche dados do agendamento
5. Sistema valida disponibilidade e salva

### 3. Processo de Check-in/Check-out (Administrador)
1. Administrador visualiza agendamentos da semana
2. Quando veículo chega, clica em "Check-in"
3. Sistema gera payload para ERP
4. Após descarga, clica em "Check-out"
5. Agendamento é marcado como finalizado

## Segurança

### Autenticação e Autorização
- **JWT Tokens**: Autenticação stateless e segura
- **Controle de acesso**: Fornecedores só acessam próprios dados
- **Validação de entrada**: Sanitização de todos os inputs
- **Senhas criptografadas**: Hash bcrypt para senhas

### Validações
- **CNPJ**: Validação de formato e dígitos verificadores
- **Email**: Validação de formato RFC 5322
- **Datas**: Validação de formato e consistência
- **Horários**: Verificação de disponibilidade

## Interface do Usuário

### Design System
O sistema utiliza um design moderno e profissional baseado em:

- **Cores**: Paleta azul corporativa com acentos coloridos
- **Tipografia**: Fonte system-ui para legibilidade
- **Componentes**: shadcn/ui para consistência
- **Responsividade**: Layout adaptável para desktop e mobile
- **Acessibilidade**: Contraste adequado e navegação por teclado

### Componentes Principais
- **Login**: Formulário centralizado com validação
- **Dashboard**: Estatísticas e navegação principal
- **Calendário Semanal**: Visualização de agendamentos
- **Formulários**: Criação e edição de dados
- **Modais**: Confirmações e alertas

## Instalação e Configuração

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- pnpm ou npm

### Backend (Flask)
```bash
cd portal_wps_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python src/main.py
```

### Frontend (React)
```bash
cd portal_wps_frontend
pnpm install
pnpm run dev
```

### Configuração
- **Backend**: Porta 5001
- **Frontend**: Porta 3000
- **Banco**: SQLite (database.db)

## Dados de Teste

### Usuário Administrador
- **Email**: admin@wps.com
- **Senha**: admin123

### Fornecedores Pré-cadastrados
1. **Fornecedor ABC Ltda**
   - Email: fornecedor1@abc.com
   - Senha: fornecedor123

2. **Transportadora XYZ S.A.**
   - Email: fornecedor2@xyz.com
   - Senha: fornecedor123

## Melhorias Futuras

### Funcionalidades Planejadas
- **Notificações**: Sistema de alertas por email/SMS
- **Relatórios**: Dashboards analíticos e exportação
- **Mobile App**: Aplicativo nativo para fornecedores
- **Integração**: APIs para sistemas de terceiros
- **Auditoria**: Log completo de ações do sistema

### Otimizações Técnicas
- **Cache**: Redis para performance
- **Banco**: PostgreSQL para produção
- **Deploy**: Containerização com Docker
- **Monitoramento**: Logs estruturados e métricas
- **Backup**: Estratégia de backup automatizado

## Suporte e Manutenção

### Logs do Sistema
O sistema registra todas as operações importantes:
- Autenticações e tentativas de login
- Criação e modificação de agendamentos
- Check-ins e check-outs realizados
- Erros e exceções do sistema

### Monitoramento
- **Performance**: Tempo de resposta das APIs
- **Disponibilidade**: Uptime do sistema
- **Uso**: Estatísticas de utilização
- **Erros**: Tracking de bugs e falhas

## Conclusão

O **Portal WPS** representa uma solução completa e moderna para gestão de agendamentos logísticos. Com sua arquitetura robusta, interface intuitiva e funcionalidades abrangentes, o sistema atende plenamente aos requisitos de controle de carga, oferecendo:

- **Eficiência operacional** através da automação de processos
- **Controle total** sobre agendamentos e movimentação de veículos
- **Integração seamless** com sistemas ERP existentes
- **Experiência de usuário** otimizada para diferentes perfis
- **Segurança** e confiabilidade em todas as operações

O sistema está pronto para uso em ambiente de produção e pode ser facilmente expandido conforme as necessidades futuras da organização.

---

**Desenvolvido com excelência pela Manus AI**  
*Transformando ideias em soluções tecnológicas de alta qualidade*
