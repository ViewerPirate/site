// Arquivo: static/js/main.js
// Lógica GERAL para o site (público e admin).
/**
 * Exibe uma notificação flutuante (toast) padronizada.
 * Esta função agora é global e deve ser usada em todo o site.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de notificação ('success', 'error', 'warning', 'info').
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const icon = document.getElementById('notificationIcon');

    if (!notification || !notificationMessage || !icon) {
        console.error('Elementos de notificação não encontrados no DOM.');
        return;
    }

    // Reseta as classes de tipo e ícone
    notification.className = 'notification';
    icon.className = 'fas';

    // Adiciona as classes corretas com base no tipo
    notification.classList.add(type);
    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    icon.classList.add(iconMap[type] || 'fa-info-circle');

    notificationMessage.textContent = message;

    // Força a re-exibição e reinício da animação
    notification.style.display = 'flex';
    notification.style.animation = 'none';
    requestAnimationFrame(() => {
        notification.style.animation = '';
    });

    // Esconde a notificação após um tempo
    setTimeout(() => {
        if (notification) {
            notification.style.display = 'none';
        }
    }, 3500);
}

/**
 * Verifica o sessionStorage por uma notificação pendente, a exibe e a remove.
 * Útil para mostrar feedback de uma ação após um redirecionamento ou recarga de página.
 */
function processSessionNotification() {
    const notificationKey = 'plugin_action_notification';
    const pendingNotificationJSON = sessionStorage.getItem(notificationKey);
    if (pendingNotificationJSON) {
        try {
            // Se existir, extrai os dados
            const { message, type } = JSON.parse(pendingNotificationJSON);
            // Usa a função global para mostrar a notificação
            showNotification(message, type);
            // CRUCIAL: Remove a chave para não exibir novamente.
            sessionStorage.removeItem(notificationKey);
        } catch (error) {
            console.error('Erro ao processar notificação da sessão:', error);
            // Limpa em caso de erro para evitar problemas futuros.
            sessionStorage.removeItem(notificationKey);
        }
    }
}


/**
 * Aplica um tema ao elemento raiz do documento (<html>).
 * @param {string} theme - O tema a ser aplicado ('light' ou 'dark').
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

/**
 * Alterna entre o tema claro e escuro, salva a preferência no localStorage
 * e aplica o novo tema.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

/**
 * Inicializa a galeria com layout Masonry.
 */
function initMasonryGallery() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;
    imagesLoaded(grid, function() {
        new Masonry(grid, {
            itemSelector: '.art-card',
            columnWidth: '.art-card',
            gutter: 20,
            percentPosition: true
        });
    });
}

/**
 * Orquestra toda a funcionalidade do filtro NSFW.
 */
function initializeNSFWFilter() {
    const nsfwCards = document.querySelectorAll('.art-card[data-nsfw="true"]');
    const ageGateModal = document.getElementById('nsfw-age-gate');

    if (nsfwCards.length === 0 || !ageGateModal) {
        return; // Se não há conteúdo NSFW ou modal, não faz nada
    }

    const confirmBtn = document.getElementById('nsfw-confirm-btn');
    const cancelBtn = document.getElementById('nsfw-cancel-btn');
    const isVerified = sessionStorage.getItem('isAgeVerified') === 'true';

    // Função para ativar os botões de toggle em cada card
    const enableNSFWToggle = () => {
        nsfwCards.forEach(card => {
            const toggleBtn = card.querySelector('.nsfw-toggle-icon-btn');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                // Garante que o ícone inicial esteja correto
                icon.className = card.classList.contains('revealed') ? 'fas fa-eye' : 'fas fa-eye-slash';

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede que o clique no botão abra o viewer de imagem
                    e.preventDefault();
                    
                    card.classList.toggle('revealed');
                    // Alterna o ícone com base na classe 'revealed'
                    icon.className = card.classList.contains('revealed') ? 'fas fa-eye' : 'fas fa-eye-slash';
                });
            }
        });
    };

    // Função para lidar com a necessidade de verificação
    const promptForAgeVerification = () => {
        // Mostra o modal ao clicar em qualquer card NSFW
        nsfwCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Se a idade ainda não foi verificada, mostra o modal em vez de abrir o viewer
                if (sessionStorage.getItem('isAgeVerified') !== 'true') {
                    e.stopPropagation();
                    e.preventDefault();
                    ageGateModal.style.display = 'flex';
                }
            }, true); // Usa captura para impedir o viewer de abrir
        });
    };

    // Lógica principal
    if (isVerified) {
        enableNSFWToggle();
    } else {
        promptForAgeVerification();
    }

    // Listeners do modal
    confirmBtn.addEventListener('click', () => {
        sessionStorage.setItem('isAgeVerified', 'true');
        ageGateModal.style.display = 'none';
        enableNSFWToggle();
    });

    cancelBtn.addEventListener('click', () => {
        window.history.back(); // Volta para a página anterior
    });
}


/**
 * Event listener que é executado quando o DOM está completamente carregado.
 */
document.addEventListener('DOMContentLoaded', async () => {
    
    // Verifica se o CMS já não foi inicializado por outro script (admin/client)
    if (!window.cms) {
        try {
            if (typeof ModularCMS !== 'undefined' && window.INJECTED_PLUGINS) {
                window.cms = new ModularCMS();
        
                await window.cms.init();
            }
        } catch (error) {
            console.error("Falha ao inicializar o sistema de plugins na página pública:", error);
        }
    }

    // Processa qualquer notificação pendente armazenada na sessão.
    processSessionNotification();
    
    // --- LÓGICA DO BOTÃO DE TEMA ---
    const themeSwitchers = document.querySelectorAll('.theme-switcher');
    themeSwitchers.forEach(switcher => {
        switcher.addEventListener('click', toggleTheme);
    });

    // --- LÓGICA DO RODAPÉ ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    
    // --- LÓGICA DE NAVEGAÇÃO ATIVA (SITE PÚBLICO) ---
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const currentPageUrl = window.location.pathname;
    navLinks.forEach(link => {
        const linkUrl = new URL(link.href).pathname;
        if (linkUrl === currentPageUrl || (currentPageUrl === '/' && link.getAttribute('href') === '/')) {
            link.classList.add('active');
        }
    });
    // --- INICIALIZAÇÃO DA GALERIA ---
    initMasonryGallery();
    
    // --- INICIALIZAÇÃO DO FILTRO NSFW ---
    initializeNSFWFilter();

    // --- LÓGICA PARA O FORMULÁRIO DE CONTATO ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const style = document.createElement('style');
        style.innerHTML = `
            .spinner-inline { 
                width: 20px;
 height: 20px; border: 2px solid rgba(255,255,255,0.3); 
                border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;
 }
            @keyframes spin { 100% { transform: rotate(360deg);
 } }
        `;
        document.head.appendChild(style);
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonHTML = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-inline"></span> Enviando...`;

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (response.ok) {
                    showNotification(result.message, 'success');
 contactForm.reset();
                } else {
                    showNotification(result.message || 'Ocorreu um erro.', 'error');
                }
            } catch (error) {
                console.error('Erro ao enviar formulário de contato:', error);
                showNotification('Erro de conexão. Tente novamente mais tarde.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
            }
        });
    }
});