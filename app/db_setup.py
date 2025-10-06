import sqlite3
import os
import json
import psycopg2
from psycopg2.extras import DictCursor
from werkzeug.security import generate_password_hash
from .utils import get_db_connection

def initialize_database():
    """Verifica, cria e popula o banco de dados se necessário."""
    print("Verificando a inicialização do banco de dados...")
    conn = None
    cursor = None # Adicionado para garantir que a variável exista no escopo do 'finally'
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        is_postgres = hasattr(conn, 'cursor_factory')
        if is_postgres:
            cursor.execute("SELECT to_regclass('public.users')")
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        
        table_exists = cursor.fetchone()

        if table_exists and table_exists[0]:
            print("Banco de dados já inicializado. Nenhuma ação necessária.")
            # AS LINHAS problemáticas foram REMOVIDAS daqui.
            # A função agora apenas retorna e deixa o 'finally' limpar.
            return

        print("Banco de dados não encontrado ou vazio. Iniciando setup completo...")
        
        placeholder = '%s' if is_postgres else '?'
        autoincrement_syntax = 'SERIAL PRIMARY KEY' if is_postgres else 'INTEGER PRIMARY KEY AUTOINCREMENT'
        boolean_default_false = 'FALSE' if is_postgres else '0'

        print("Verificando e criando tabelas se necessário...")

        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS users (
            id {autoincrement_syntax}, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_admin BOOLEAN NOT NULL DEFAULT {boolean_default_false},
            is_blocked INTEGER NOT NULL DEFAULT 0, is_banned INTEGER NOT NULL DEFAULT 0,
            notify_on_site INTEGER NOT NULL DEFAULT 1, notify_by_email INTEGER NOT NULL DEFAULT 1,
            is_public_artist BOOLEAN NOT NULL DEFAULT {boolean_default_false}, artist_specialties TEXT,
            artist_portfolio_description TEXT, artist_avatar TEXT, social_links TEXT, artist_bio TEXT
        )''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS comissoes (
            id TEXT PRIMARY KEY NOT NULL, client TEXT, type TEXT, date TEXT, deadline TEXT, price REAL, status TEXT,
            description TEXT, preview TEXT, comments TEXT, reference_files TEXT, client_id INTEGER,
            current_preview INTEGER, phases TEXT, current_phase_index INTEGER, revisions_used INTEGER,
            event_log TEXT, payment_status TEXT NOT NULL DEFAULT 'unpaid', payment_method TEXT, assigned_artist_ids TEXT
        )''')

        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS notifications (
            id {autoincrement_syntax}, user_id INTEGER, message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, related_commission_id TEXT
        )''')

        cursor.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT)')

        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS gallery (
            id {autoincrement_syntax}, title TEXT NOT NULL, description TEXT, image_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, lineart_artist_id INTEGER, color_artist_id INTEGER,
            is_nsfw BOOLEAN NOT NULL DEFAULT {boolean_default_false}
        )''')

        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS contact_messages (
            id {autoincrement_syntax}, sender_name TEXT NOT NULL, sender_email TEXT NOT NULL,
            message_content TEXT NOT NULL, received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_read INTEGER NOT NULL DEFAULT 0
        )''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS plugins (
            id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT, version TEXT, code TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0, scope TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS faqs (
            id {autoincrement_syntax}, question TEXT NOT NULL, answer TEXT NOT NULL, display_order INTEGER
        )''')
        
        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS artist_services (
            id {autoincrement_syntax}, artist_id INTEGER NOT NULL, service_name TEXT NOT NULL, description TEXT,
            price REAL NOT NULL, deadline_days INTEGER, phases TEXT, is_active BOOLEAN NOT NULL DEFAULT {boolean_default_false},
            FOREIGN KEY (artist_id) REFERENCES users(id)
        )''')

        print("Tabelas verificadas.")
        print("Populando com dados iniciais...")

        admin_pass = 'Admin@123'
        hashed_password = generate_password_hash(admin_pass)
        admin_socials = json.dumps([
            {'network': 'Instagram', 'url': 'https://instagram.com/artista1'},
            {'network': 'ArtStation', 'url': 'https://www.artstation.com/artista1'}
        ])
        
        query_users = f'INSERT INTO users (username, password_hash, is_admin, is_public_artist, artist_specialties, artist_portfolio_description, artist_avatar, social_links, artist_bio) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})'
        
        if is_postgres:
            cursor.execute(query_users + " RETURNING id", ('Artista Principal', hashed_password, True, True, '["Retratos a Óleo", "Arte Digital", "Cenários"]', 'Especialista em técnicas clássicas com um toque moderno.', 'https://i.imgur.com/j3WKhcU.jpeg', admin_socials, 'Esta é a minha bio padrão.'))
            artist1_id = cursor.fetchone()['id']
        else:
            cursor.execute(query_users, ('Artista Principal', hashed_password, True, True, '["Retratos a Óleo", "Arte Digital", "Cenários"]', 'Especialista em técnicas clássicas com um toque moderno.', 'https://i.imgur.com/j3WKhcU.jpeg', admin_socials, 'Esta é a minha bio padrão.'))
            artist1_id = cursor.lastrowid
        print(f"Usuário 'Artista Principal' criado (ID: {artist1_id}).")

        artist2_pass = 'Artista@123'
        hashed_password_2 = generate_password_hash(artist2_pass)
        artist2_socials = json.dumps([
            {'network': 'Twitter', 'url': 'https://twitter.com/artista2'},
            {'network': 'Behance', 'url': 'https://www.behance.net/artista2'}
        ])

        if is_postgres:
            cursor.execute(query_users + " RETURNING id", ('artista2', hashed_password_2, True, True, '["Animação", "Design de Personagens"]', 'Foco em arte estilizada e vibrante.', 'https://i.imgur.com/8x022_I.jpeg', artist2_socials, 'Bio do Artista 2.'))
            artist2_id = cursor.fetchone()['id']
        else:
            cursor.execute(query_users, ('artista2', hashed_password_2, True, True, '["Animação", "Design de Personagens"]', 'Foco em arte estilizada e vibrante.', 'https://i.imgur.com/8x022_I.jpeg', artist2_socials, 'Bio do Artista 2.'))
            artist2_id = cursor.lastrowid
        print(f"Usuário 'artista2' criado (ID: {artist2_id}).")

        print("Populando serviços individuais dos artistas...")
        phases_padrao = json.dumps([
            {"name": "Esboço", "revisions_limit": 2},
            {"name": "Arte Final", "revisions_limit": 1}
        ])
        query_services = f'INSERT INTO artist_services (artist_id, service_name, description, price, deadline_days, phases, is_active) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})'
        
        cursor.execute(query_services, (artist1_id, 'Retrato a Óleo Digital', 'Retrato realista com textura de pintura a óleo', 550.00, 14, phases_padrao, True))
        cursor.execute(query_services, (artist2_id, 'Avatar Estilizado', 'Ícone para redes sociais em estilo cartoon', 150.00, 5, phases_padrao, True))
        print("Serviços de exemplo inseridos.")

        default_settings = {
            'site_mode': 'individual', 'studio_name': 'Nome do Estúdio', 'artist_name': 'Seu Nome Artístico',
            'artist_email': 'contato@seu-site.com', 'artist_location': 'Sua Cidade, Seu Estado',
            'artist_bio': 'Esta é uma biografia padrão.', 'artist_process': 'Este é um texto padrão sobre o processo.',
            'artist_inspirations': 'Este é um texto padrão sobre inspirações.', 'home_headline': 'Bem-vindo à minha Galeria Digital',
            'home_subheadline': 'Explore um universo de cores e formas.',
            'social_links': json.dumps([{'network': 'Instagram', 'url': 'https://instagram.com/seu-usuario'}]),
            'commission_types': json.dumps([{'name': 'Ilustração Básica', 'price': 250.00, 'deadline': 7}]),
            'commission_extras': json.dumps([{'name': 'Fundo Detalhado', 'price': 150.00}]),
            'default_phases': json.dumps([{"name": "Esboço", "revisions_limit": 3}]),
            'refund_policy': '50% de reembolso para pedidos cancelados antes do início.',
            'revision_alert_text': 'Você possui <strong>{revisions_left} de {revisions_limit}</strong> revisões restantes.',
            'custom_css_theme': '',
            'paypal_email': os.environ.get('PAYPAL_EMAIL', 'seu-email-aqui@paypal.com'),
            'paypal_hosted_button_id': os.environ.get('PAYPAL_HOSTED_BUTTON_ID', 'SEU_ID_DE_BOTAO_AQUI'),
            'payment_currency_code': 'BRL', 'pix_key': '000.000.000-00',
            'TELEGRAM_ENABLED': 'false',
            'TELEGRAM_BOT_TOKEN': os.environ.get('TELEGRAM_BOT_TOKEN', ''),
            'TELEGRAM_CHAT_ID': os.environ.get('TELEGRAM_CHAT_ID', ''),
            'TELEGRAM_TEMPLATE_CONTACT': '🔔 *Nova mensagem de contato!*\n\n*De:* {name}\n*Email:* {email}\n\n*Mensagem:*\n{message}',
            'TELEGRAM_TEMPLATE_NEW_COMMISSION': '🎨 *Novo Pedido Recebido!*\n\n*ID:* {commission_id}\n*Cliente:* {client_name}\n*Tipo:* {commission_type}\n*Valor:* R$ {price}'
        }
        
        query_settings = f"INSERT INTO settings (key, value) VALUES ({placeholder}, {placeholder})"
        for key, value in default_settings.items():
            cursor.execute(query_settings, (key, value))
        print("Configurações padrão inseridas.")
        
        conn.commit()
        print("Banco de dados inicializado e populado com sucesso!")

    except Exception as e:
        print(f"ERRO CRÍTICO durante a inicialização do banco de dados: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()