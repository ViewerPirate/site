import json
import os 
import urllib3
from flask import Flask, session
from flask_socketio import SocketIO
from .utils import get_db_connection
from .db_setup import initialize_database

# Cria a instância do SocketIO globalmente
socketio = SocketIO()

def create_app():
    """Cria e configura uma instância da aplicação Flask."""
    
    # O argumento 'static_folder' foi removido para usar o padrão do Flask
    app = Flask(__name__, instance_relative_config=True)
    app.secret_key = 'sua_chave_secreta_super_aleatoria_aqui'

    # === INÍCIO DA CORREÇÃO PARA URLLIB3/EVENTLET/SSL NO PYTHON RECENTE ===
    if hasattr(urllib3.util.ssl_, 'DEFAULT_CIPHERS'):
        urllib3.util.ssl_.DEFAULT_CIPHERS += ':HIGH:!DH:!aNULL'
    if hasattr(urllib3.util.ssl_, 'minimum_version'):
        del urllib3.util.ssl_.minimum_version
    # === FIM DA CORREÇÃO ===

    # --- EXECUTE A INICIALIZAÇÃO DO BANCO DE DADOS AQUI ---
    # Usamos o app_context para garantir que qualquer configuração da app esteja disponível
    with app.app_context():
        initialize_database()
    # -----------------------------------------------------------

    # Inicializa o SocketIO com a app Flask
    socketio.init_app(app)

    # Importa e registra os Blueprints
    from .auth.routes import auth_bp
    from .public.routes import public_bp
    from .client.routes import client_bp
    from .admin.routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(admin_bp)

    # --- Injetor de Contexto Global ---
    @app.context_processor
    def inject_site_settings():
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT key, value FROM settings')
            settings_db = cursor.fetchall()
            settings = {row['key']: row['value'] for row in settings_db}
 
            cursor.execute("SELECT id, code FROM plugins WHERE is_active = 1 AND scope = 'public'")
            public_plugins_db = cursor.fetchall()
            public_plugins = [dict(row) for row in public_plugins_db]

            admin_plugins = []
            if session.get('is_admin'):
                cursor.execute("SELECT id, code FROM plugins WHERE is_active = 1 AND scope = 'admin'")
                admin_plugins_db = cursor.fetchall()
                admin_plugins = [dict(row) for row in admin_plugins_db]
            
            cursor.close()
            conn.close()
            
            site_mode = settings.get('site_mode', 'individual')
   
            if site_mode == 'studio':
                display_name = settings.get('studio_name', 'Nome do Estúdio')
            else:
                display_name = settings.get('artist_name', 'Nome Padrão')
           
            session_avatar_url = session.get('avatar_url', None)
          
            social_links = []
            if 'social_links' in settings and settings['social_links']:
                try:
                    social_links = json.loads(settings['social_links'])
                except json.JSONDecodeError:
                    social_links = []
 
            return dict(
                artist_name=display_name, 
                site_mode=site_mode,
                session_avatar_url=session_avatar_url,
                artist_email=settings.get('artist_email', 'contato@email.com'),
                artist_location=settings.get('artist_location', 'Localização Padrão'),
                artist_avatar=settings.get('artist_avatar', 'https://placehold.co/400x400'),
                artist_bio=settings.get('artist_bio', 'Biografia padrão.'),
                artist_process=settings.get('artist_process', 'Processo criativo padrão.'),
                artist_inspirations=settings.get('artist_inspirations', 'Inspirações padrão.'),
                home_headline=settings.get('home_headline', 'Bem-vindo à Galeria'),
                home_subheadline=settings.get('home_subheadline', 'Explore as obras.'),
                social_links=social_links,
                custom_css=settings.get('custom_css_theme', None),
                paypal_email=settings.get('paypal_email'),
                paypal_hosted_button_id=settings.get('paypal_hosted_button_id'),
                pix_key=settings.get('pix_key'),
                payment_currency_code=settings.get('payment_currency_code', 'BRL'),
                public_plugins=public_plugins,
                admin_plugins=admin_plugins
            )
        except Exception as e:
            print(f"Aviso: Não foi possível injetar configurações do site (pode ser o primeiro build): {e}")
            return {}

    return app
