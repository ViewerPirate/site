import eventlet
eventlet.monkey_patch(all=True, psycopg=True)  # 'all=True' garante que tudo seja patched, incluindo threading/locks

from run import app  # Importa após o patch
