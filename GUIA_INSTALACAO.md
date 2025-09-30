# Guia de Instalação - Portal WPS

## Instalação Rápida

### 1. Pré-requisitos
- Python 3.11+
- Node.js 18+
- Git

### 2. Clonagem e Configuração

```bash
# Clonar os projetos (se estiverem em repositório)
# Ou copiar as pastas portal_wps_backend e portal_wps_frontend

# Configurar Backend
cd portal_wps_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Inicializar banco de dados
python init_data.py

# Iniciar servidor backend
python src/main.py
# Servidor rodará em http://localhost:5001
```

```bash
# Configurar Frontend (em outro terminal)
cd portal_wps_frontend
pnpm install  # ou npm install

# Iniciar servidor frontend
pnpm run dev  # ou npm run dev
# Aplicação rodará em http://localhost:3000
```

### 3. Acesso ao Sistema

Abra o navegador em: **http://localhost:3000**

## Credenciais de Teste

### Administrador
- **Email**: admin@wps.com
- **Senha**: admin123

### Fornecedores
- **Fornecedor 1**: fornecedor1@abc.com / fornecedor123
- **Fornecedor 2**: fornecedor2@xyz.com / fornecedor123

## Funcionalidades Principais

### Como Administrador:
1. **Gerenciar Fornecedores**: Aba "Fornecedores" → "Novo Fornecedor"
2. **Visualizar Agendamentos**: Aba "Agendamentos" → Navegação semanal
3. **Check-in/Check-out**: Botões nos agendamentos da semana
4. **Editar Agendamentos**: Botão de edição em cada agendamento

### Como Fornecedor:
1. **Ver Agendamentos**: Calendário semanal com navegação
2. **Criar Agendamento**: Botão "Novo Agendamento"
3. **Editar Agendamento**: Botão de edição nos próprios agendamentos

## Estrutura de Arquivos

```
portal_wps/
├── portal_wps_backend/     # API Flask
├── portal_wps_frontend/    # Interface React
├── DOCUMENTACAO_PORTAL_WPS.md
└── GUIA_INSTALACAO.md
```

## Solução de Problemas

### Backend não inicia
- Verificar se Python 3.11+ está instalado
- Ativar ambiente virtual: `source venv/bin/activate`
- Instalar dependências: `pip install -r requirements.txt`

### Frontend não carrega
- Verificar se Node.js 18+ está instalado
- Instalar dependências: `pnpm install`
- Verificar se backend está rodando na porta 5001

### Erro de conexão API
- Confirmar que backend está em http://localhost:5001
- Verificar configuração de proxy no vite.config.js

### Banco de dados vazio
- Executar: `python init_data.py` no diretório backend
- Verificar se arquivo database.db foi criado

## Suporte

Para dúvidas ou problemas:
1. Consultar a documentação completa
2. Verificar logs do console do navegador
3. Verificar logs do terminal do backend
4. Contatar suporte técnico se necessário
