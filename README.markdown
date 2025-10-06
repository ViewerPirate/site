# Artista Admin - Sistema de Gerenciamento de Comissões Artísticas

Bem-vindo ao **Artista Admin**, um sistema completo para gerenciamento de comissões artísticas, com um site público para exibição de portfólio e um painel administrativo para controle de pedidos, clientes, agenda, finanças e relatórios. Este projeto é construído com **Flask** (Python) para o backend, **SQLite** para o banco de dados, e **HTML/CSS/JavaScript** para o frontend, utilizando uma paleta de cores consistente e design moderno.

## Estrutura do Projeto

O projeto segue uma estrutura organizada para facilitar manutenção e escalabilidade:

```
[SITE - Copia]
├── app.py                     # Aplicação Flask principal
├── database.db                # Banco de dados SQLite
├── init_db.py                 # Script para inicializar o banco de dados
├── manage_admin.py            # Script para gerenciar status de administrador
├── static/                    # Arquivos estáticos (CSS, JS, imagens)
│   ├── css/                   # Estilos do site público
│   │   ├── style.css          # Estilos globais do site
│   │   └── admin_css/         # Estilos do painel administrativo
│   │       ├── admin_estilos.css  # Importa todos os componentes CSS
│   │       └── components/    # Componentes modulares de CSS
│   ├── js/                    # Scripts JavaScript
│   │   ├── main.js            # Lógica geral do site
│   │   └── admin_js/          # Scripts do painel administrativo
│   │       ├── api.js         # Funções para chamadas à API
│   │       ├── calendar.js    # Lógica do widget de calendário
│   │       ├── main.js        # Lógica geral do painel admin
│   │       └── pages/         # Scripts específicos por página
│   └── images/                # Imagens do site (atualmente vazio)
└── templates/                 # Templates Jinja2
    ├── base.html              # Template base do site
    ├── index.html             # Página inicial (galeria)
    ├── sobre.html             # Página "Sobre"
    ├── contato.html           # Página de contato
    ├── login.html             # Página de login
    ├── registro.html          # Página de registro
    ├── dashboard.html         # Painel do cliente
    ├── _header.html           # Componente de cabeçalho
    ├── _footer.html           # Componente de rodapé
    └── admin/                 # Templates do painel administrativo
        ├── admin_layout.html  # Layout base do painel admin
        ├── components/        # Componentes reutilizáveis
        └── pages/             # Páginas específicas do painel
```

### Por que essa estrutura?

- **Modularidade**: Separar arquivos estáticos (`static/`) e templates (`templates/`) melhora a organização e facilita a manutenção.
- **Separação de responsabilidades**: O site público (`index.html`, `sobre.html`, etc.) é voltado para clientes e visitantes, enquanto o painel administrativo (`admin/`) é restrito a administradores, com rotas protegidas.
- **Reutilização**: Componentes como `_header.html`, `_footer.html` e arquivos CSS/JS modulares (`_base.css`, `api.js`, etc.) evitam duplicação de código.
- **Escalabilidade**: A estrutura permite adicionar novas páginas ou funcionalidades facilmente, com suporte a rotas de API para interações dinâmicas.

## Pré-requisitos

Para rodar o projeto, você precisará de:

- **Python 3.8+**
- **pip** (gerenciador de pacotes Python)
- **Virtualenv** (opcional, mas recomendado)
- **Navegador moderno** (para o frontend)
- **Dependências Python**:
  - Flask
  - Werkzeug
  - SQLite3 (integrado ao Python)

## Como Iniciar o Projeto

### 1. Clonar o Repositório
Clone o repositório para sua máquina local:

```bash
git clone <URL_DO_REPOSITORIO>
cd artista-admin
```

### 2. Configurar o Ambiente Virtual (Opcional)
Crie e ative um ambiente virtual para isolar as dependências:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Instalar Dependências
Instale as dependências necessárias:

```bash
pip install flask werkzeug
```

### 4. Inicializar o Banco de Dados
Execute o script `init_db.py` para criar o banco de dados SQLite (`database.db`) com as tabelas e dados iniciais:

```bash
python init_db.py
```

Isso criará:
- Tabela `users` (usuários e clientes)
- Tabela `comissoes` (pedidos de arte)
- Tabela `notifications` (notificações do painel)
- Tabela `settings` (configurações do artista)
- Um usuário administrador padrão (`admin@exemplo.com`, senha: `admin123`)

### 5. Iniciar o Servidor
Execute o aplicativo Flask:

```bash
python app.py
```

O servidor estará disponível em `http://localhost:5000`.

### 6. Acessar o Site
- **Site Público**: Acesse `http://localhost:5000` para ver a galeria, página "Sobre" e "Contato".
- **Painel do Cliente**: Faça login com uma conta de cliente em `/login` para acessar o painel em `/dashboard`.
- **Painel Administrativo**: Faça login com a conta de administrador (`admin@exemplo.com`, senha: `admin123`) para acessar o painel em `/admin/dashboard`.

### 7. Gerenciar Status de Administrador
Para promover ou rebaixar usuários como administradores, use o script `manage_admin.py`:

```bash
python manage_admin.py promote seu_email@exemplo.com
python manage_admin.py demote seu_email@exemplo.com
```

## Funcionalidades Principais

### Site Público
- **Galeria** (`/index`): Exibe obras de arte com um modal para detalhes.
- **Sobre** (`/sobre`): Conta a história do artista e seu processo criativo.
- **Contato** (`/contato`): Formulário para visitantes enviarem mensagens.
- **Autenticação** (`/login`, `/registro`): Sistema de login e registro para clientes.
- **Painel do Cliente** (`/dashboard`): Exibe comissões do cliente (a ser expandido).

### Painel Administrativo
- **Dashboard** (`/admin/dashboard`): Visão geral com cartões de KPIs, pedidos recentes, calendário e feed de atividades.
- **Comissões** (`/admin/comissoes`): Gerenciamento de pedidos (criar, editar, excluir, atualizar status).
- **Clientes** (`/admin/clientes`): Gerenciamento de clientes (criar, bloquear, banir, configurar notificações).
- **Agenda** (`/admin/agenda`): Visualização de prazos de comissões em uma linha do tempo.
- **Financeiro** (`/admin/financeiro`): Análise de receita, comissões pagas e ticket médio, com filtros por período.
- **Relatórios** (`/admin/relatorios`): Relatórios anuais com KPIs, receita por tipo de arte, top clientes e volume de comissões por mês.
- **Configurações** (`/admin/configuracoes`): Configuração do perfil do artista e tipos de comissão padrão.

### Banco de Dados
- **Unificado**: Uma única base SQLite (`database.db`) integra usuários, comissões, notificações e configurações.
- **Segurança**: Senhas são armazenadas com hash (usando Werkzeug).
- **Flexibilidade**: A tabela `settings` permite configurações dinâmicas, como tipos de comissão padrão.

## Por que as Coisas São Como São?

### Tecnologias Escolhidas
- **Flask**: Framework leve e flexível para Python, ideal para projetos web de pequeno a médio porte.
- **SQLite**: Banco de dados leve, sem necessidade de servidor, adequado para projetos iniciais e testes.
- **Jinja2**: Para templates dinâmicos, permitindo reutilização de componentes como `_header.html` e `_footer.html`.
- **Chart.js**: Para gráficos interativos nos relatórios e análises financeiras.
- **Font Awesome e Lucide Icons**: Ícones leves e modernos para uma interface amigável.
- **CSS com Variáveis**: Uso de variáveis CSS (`:root`) para manter consistência na paleta de cores (`--cor-dominante-60`, `--cor-destaque-10`, etc.).

### Design e Interface
- **Paleta 60/30/10**: Usa uma paleta de cores com 60% de tons escuros (fundo), 30% de tons médios (cards, bordas) e 10% de tons de destaque (botões, links) para um design equilibrado e profissional.
- **Responsividade**: Media queries em CSS garantem usabilidade em dispositivos móveis e desktops.
- **Efeito de Vidro Fosco**: Aplicado no cabeçalho (`header-glass`) para um visual moderno.
- **Componentização**: CSS e templates são divididos em componentes modulares (`_cards.css`, `_sidebar.html`, etc.) para facilitar manutenção.

### Segurança
- **Decorators**: `@login_required` e `@admin_required` protegem rotas sensíveis.
- **Hash de Senhas**: Senhas são armazenadas com hash para segurança.
- **Notificações**: Sistema de notificações no painel admin para rastrear ações importantes.

### Escalabilidade
- **API RESTful**: Rotas como `/admin/api/comissoes` permitem interações dinâmicas via JavaScript.
- **Estrutura Modular**: Fácil de adicionar novas páginas ou funcionalidades ao painel admin ou site público.
- **Configurações Dinâmicas**: A tabela `settings` suporta personalização sem alterações no código.

## Notas de Desenvolvimento
- **Imagens**: Atualmente, o projeto usa placeholders (ex.: `https://placehold.co`). Substitua por imagens reais em `static/images/`.
- **Painel do Cliente**: O painel do cliente (`dashboard.html`) está básico e pode ser expandido para exibir comissões específicas do usuário.
- **Testes**: Recomenda-se adicionar testes unitários (ex.: com `pytest`) para rotas e funções críticas.
- **Hospedagem**: Para produção, considere um banco de dados mais robusto (ex.: PostgreSQL) e um servidor WSGI (ex.: Gunicorn).

## Problemas Conhecidos
- O arquivo `database.db` não pôde ser lido devido a um erro de codificação. Certifique-se de que ele seja recriado corretamente com `init_db.py`.
- Algumas funcionalidades do painel do cliente (ex.: listagem de comissões) ainda precisam de implementação completa.

## Contribuições
Contribuições são bem-vindas! Para contribuir:
1. Faça um fork do repositório.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`).
3. Commit suas alterações (`git commit -m 'Adiciona nova funcionalidade'`).
4. Envie para o repositório remoto (`git push origin feature/nova-funcionalidade`).
5. Abra um Pull Request.

## Licença
Este projeto é licenciado sob a [Licença MIT](LICENSE).

---

**Desenvolvido por [Seu Nome Artístico]**  
Para suporte ou dúvidas, entre em contato via [seuemail@exemplo.com](mailto:seuemail@exemplo.com).