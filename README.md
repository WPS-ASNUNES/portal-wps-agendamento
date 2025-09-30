# Portal WPS - Agendamento de Carga

Portal completo de agendamento logístico para fornecedores desenvolvido com Flask (Backend) e React (Frontend).

## 📋 Funcionalidades

### 👨‍💼 Administrador
- **Gestão de Fornecedores**: Cadastrar, editar, bloquear e excluir fornecedores
- **Gestão de Agendamentos**: Visualizar, editar e excluir todos os agendamentos
- **Check-in/Check-out**: Controle de entrada e saída com integração ERP
- **Configuração de Horários**: 
  - Horários padrão (ex: bloqueio diário para almoço)
  - Horários específicos (bloqueios pontuais)
- **Calendário Semanal**: Visualização completa por horários
- **Relatórios**: Estatísticas em tempo real

### 🚛 Fornecedor
- **Agendamentos Próprios**: Criar, editar e cancelar agendamentos
- **Calendário Interativo**: Visualização semanal com horários disponíveis
- **Validação de Conflitos**: Horários ocupados aparecem como indisponíveis
- **Formulários Validados**: Dados de PO, placa, motorista

## 🏗️ Arquitetura

### Backend (Flask)
- **API RESTful** com autenticação JWT
- **Banco SQLite** com SQLAlchemy ORM
- **Validações** de conflitos e permissões
- **Integração ERP** via payload JSON
- **CORS** configurado para frontend

### Frontend (React)
- **Interface moderna** com Tailwind CSS + shadcn/ui
- **Componentes reutilizáveis** e responsivos
- **Gerenciamento de estado** com hooks
- **Validação em tempo real**
- **Experiência otimizada** para desktop e mobile

## 🚀 Instalação e Uso

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- pnpm ou npm

### Backend (Flask)
```bash
cd portal_wps_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_data.py  # Criar dados de teste
python src/main.py
```

### Frontend (React)
```bash
cd portal_wps_frontend
pnpm install
pnpm run build
# Os arquivos serão copiados automaticamente para o Flask
```

### Acesso
- **URL**: http://localhost:5001
- **Admin**: admin@wps.com / admin123
- **Fornecedor 1**: fornecedor1@abc.com / fornecedor123
- **Fornecedor 2**: fornecedor2@xyz.com / fornecedor123

## 📁 Estrutura do Projeto

```
portal-wps-agendamento/
├── portal_wps_backend/          # Backend Flask
│   ├── src/
│   │   ├── models/              # Modelos do banco de dados
│   │   ├── routes/              # Rotas da API
│   │   ├── static/              # Arquivos do frontend (build)
│   │   └── main.py              # Aplicação principal
│   ├── venv/                    # Ambiente virtual Python
│   ├── requirements.txt         # Dependências Python
│   └── init_data.py            # Script de dados iniciais
├── portal_wps_frontend/         # Frontend React
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── lib/                 # Utilitários e API
│   │   └── App.jsx              # Componente principal
│   ├── dist/                    # Build de produção
│   └── package.json             # Dependências Node.js
├── DOCUMENTACAO_PORTAL_WPS.md   # Documentação técnica
├── GUIA_INSTALACAO.md           # Guia de instalação
└── README.md                    # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Backend
FLASK_ENV=production
SECRET_KEY=sua_chave_secreta_aqui
DATABASE_URL=sqlite:///portal_wps.db

# Frontend (vite.config.js)
VITE_API_URL=http://localhost:5001/api
```

### Banco de Dados
O sistema usa SQLite por padrão. Para produção, configure PostgreSQL ou MySQL:

```python
# src/main.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/portal_wps'
```

## 🧪 Testes

### Teste de Conflitos de Horários
1. Login como Fornecedor 1
2. Agende um horário (ex: Terça 14:00)
3. Login como Fornecedor 2
4. Verifique que o horário aparece como "Indisponível" em vermelho

### Teste de Configurações
1. Login como Admin
2. Configure horários padrão (ex: 12:00 = Almoço)
3. Verifique que o bloqueio se aplica a todos os dias

## 🔒 Segurança

- **Autenticação JWT** com expiração
- **Validação de permissões** por role
- **Sanitização de dados** de entrada
- **CORS** configurado adequadamente
- **Soft delete** para fornecedores

## 📊 Integração ERP

O sistema gera automaticamente um payload JSON no check-in:

```json
{
  "appointment_id": 123,
  "supplier_cnpj": "12.345.678/0001-90",
  "purchase_order": "PO-2025-001",
  "truck_plate": "ABC-1234",
  "driver_name": "João Silva",
  "check_in_time": "2025-09-29T14:30:00",
  "status": "checked_in"
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- **Email**: suporte@wps.com
- **GitHub Issues**: [Abrir issue](https://github.com/WPS-ASNUNES/portal-wps-agendamento/issues)

---

**Desenvolvido com ❤️ para otimizar a logística de fornecedores**
