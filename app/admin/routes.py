# Arquivo: app/admin/routes.py (O Orquestrador)

from flask import Blueprint

# 1. Cria o Blueprint do admin (MODIFICADO: 'template_folder' removido)
admin_bp = Blueprint(
    'admin', 
    __name__, 
    url_prefix='/admin'
)

# 2. Importa os módulos de rotas.
# Esta ação "registra" as rotas definidas nesses arquivos no admin_bp.
# É crucial que estas importações venham DEPOIS da criação do admin_bp.
from . import page_routes
from . import api_comissoes_routes
from . import api_clients_routes
from . import api_gallery_routes
from . import api_messages_routes
from . import api_reports_routes
from . import api_settings_routes
from . import api_plugins_routes
from . import api_faqs_routes
from . import api_profile_routes
