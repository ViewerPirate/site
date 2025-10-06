// Arquivo: static/js/admin_js/pages/clientes.js
// Script específico para a nova página de CRM de Clientes.

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos na página correta do CRM
    const crmView = document.getElementById('crm-view');
    if (!crmView) {
        return;
    }
    
    // Pega o ID do admin logado, que foi injetado no template
    const loggedInAdminId = parseInt(document.body.dataset.userId, 10);

    // Função principal que carrega e renderiza todos os dados
    async function initializeCRM() {
        const tableBody = document.getElementById('crm-clients-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner"></div></td></tr>';

        try {
            // 1. Busca os clientes da API real
            const clients = await fetchClients(); // Função de api.js

            if (clients.length === 0) {
                document.getElementById('kpi-total-clients').textContent = 0;
                document.getElementById('kpi-new-clients').textContent = 0;
                document.getElementById('kpi-total-revenue').textContent = (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum cliente encontrado.</td></tr>';
                return;
            }

            // 2. Simula dados adicionais para o CRM (como no plugin)
            const clientsWithMockData = clients.map(client => ({
                ...client,
                totalSpent: Math.random() * 2000,
                totalOrders: Math.floor(Math.random() * 15) + 1,
                lastOrder: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
                health: ['good', 'ok', 'risk'][Math.floor(Math.random() * 3)]
            }));

            // 3. Renderiza os KPIs
            renderKPIs(clients, clientsWithMockData);

            // 4. Renderiza a tabela
            renderCRMTable(clientsWithMockData);

        } catch (error) {
            console.error("Erro ao carregar dados dos clientes:", error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">${error.message}</td></tr>`;
        }
    }

    
    // Função para renderizar os cartões de KPI
    function renderKPIs(clients, clientsWithMockData) {
        document.getElementById('kpi-total-clients').textContent = clients.length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newClientsCount = clients.filter(c => new Date(c.created_at) > thirtyDaysAgo).length;
        document.getElementById('kpi-new-clients').textContent = newClientsCount;

        const totalRevenue = clientsWithMockData.reduce((sum, c) => sum + c.totalSpent, 0);
        document.getElementById('kpi-total-revenue').textContent = totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função para renderizar as linhas da tabela do CRM
    function renderCRMTable(clientsWithMockData) {
        const tableBody = document.getElementById('crm-clients-table-body');
        tableBody.innerHTML = '';

        clientsWithMockData.forEach(client => {
            const row = document.createElement('tr');
            
            const isAdminText = client.is_admin ? 'Admin' : 'Usuário';
            const isAdminClass = client.is_admin ? 'status-completed' : 'status-cancelled';
            
            // Lógica do botão de promover/rebaixar
            const actionText = client.is_admin ? 'Rebaixar' : 'Promover';
            const actionClass = client.is_admin ? 'btn-warning' : 'btn-success';
            // Desabilita o botão se o ID do cliente for o mesmo do admin logado
            const isDisabled = client.id === loggedInAdminId ? 'disabled' : '';

            row.innerHTML = `
                <td><span class="client-health-indicator health-${client.health}" title="Saúde do cliente: ${client.health}"></span></td>
                <td><strong>${client.name}</strong></td>
                <td><span class="status ${isAdminClass}">${isAdminText}</span></td>
                <td>${client.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${client.totalOrders}</td>
                <td>${client.lastOrder.toLocaleDateString('pt-BR')}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" class="toggle-block" data-id="${client.id}" ${client.is_blocked ? 'checked' : ''} aria-label="Bloquear ou desbloquear cliente">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <label class="switch">
                        <input type="checkbox" class="toggle-ban" data-id="${client.id}" ${client.is_banned ? 'checked' : ''} aria-label="Banir ou readmitir cliente">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm ${actionClass} admin-toggle-btn" data-id="${client.id}" ${isDisabled}>${actionText}</button>
                        <button class="btn btn-sm btn-light" title="Anotações" data-action="edit-notes" data-name="${client.name}"><i class="fas fa-sticky-note"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addTableActionListeners();
    }

    // Função para adicionar os listeners de eventos para a tabela e modais
    function addTableActionListeners() {
        // Listener para o novo botão de promover/rebaixar
        document.querySelectorAll('.admin-toggle-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const clientId = btn.dataset.id;
                const currentAction = btn.textContent.trim();
                const confirmationText = `${currentAction === 'Promover' ? 'promover' : 'rebaixar'} o usuário '${btn.closest('tr').querySelector('strong').textContent}'`;

                if (confirm(`Tem certeza que deseja ${confirmationText}?`)) {
                    const result = await toggleAdminStatus(clientId);
                    if (result.success) {
                        showNotification('Status de administrador alterado com sucesso!', 'success');
                        // Atualiza a UI sem recarregar a página
                        const statusCell = btn.closest('tr').querySelector('td:nth-child(3) span');
                        if (result.is_admin) {
                            btn.textContent = 'Rebaixar';
                            btn.classList.remove('btn-success');
                            btn.classList.add('btn-warning');
                            statusCell.textContent = 'Admin';
                            statusCell.className = 'status status-completed';
                        } else {
                            btn.textContent = 'Promover';
                            btn.classList.remove('btn-warning');
                            btn.classList.add('btn-success');
                            statusCell.textContent = 'Usuário';
                            statusCell.className = 'status status-cancelled';
                        }
                    } else {
                        showNotification(result.message || 'Ocorreu um erro.', 'error');
                    }
                }
            });
        });
        
        // Listeners para os toggles de bloquear e banir
        document.querySelectorAll('.toggle-block').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                await toggleClientBlock(e.target.dataset.id); // Função de api.js
                showNotification('Status de bloqueio alterado.', 'success');
            });
        });

        document.querySelectorAll('.toggle-ban').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                await toggleClientBan(e.target.dataset.id); // Função de api.js
                showNotification('Status de banimento alterado.', 'success');
            });
        });

        // Listeners para o modal de anotações
        const notesModal = document.getElementById('client-notes-modal');
        document.querySelectorAll('[data-action="edit-notes"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientName = e.currentTarget.dataset.name;
                document.getElementById('client-notes-modal-name').textContent = clientName;
                document.getElementById('client-notes-modal-textarea').value = `Anotações para ${clientName}...`; // Placeholder
                notesModal.style.display = 'flex';
            });
        });

        if (notesModal) {
            notesModal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => notesModal.style.display = 'none'));
            notesModal.addEventListener('click', e => { if (e.target === notesModal) notesModal.style.display = 'none'; });
            document.getElementById('client-notes-modal-save').addEventListener('click', () => {
                showNotification('Anotações salvas com sucesso! (Funcionalidade simulada)', 'success');
                notesModal.style.display = 'none';
            });
        }
    }
    
    // Reutiliza a lógica existente para o modal de criação de cliente
    function setupCreateClientModal() {
        const createClientModal = document.getElementById('create-client-modal');
        const newClientBtn = document.getElementById('crm-add-client-btn'); // Botão do novo layout
        const createClientForm = document.getElementById('create-client-form');

        if (newClientBtn) {
            newClientBtn.addEventListener('click', () => {
                createClientForm.reset();
                createClientModal.style.display = 'flex';
            });
        }
    
        if (createClientModal) {
            createClientModal.addEventListener('click', (event) => {
                if (event.target === createClientModal || event.target.closest('.close-modal')) {
                    createClientModal.style.display = 'none';
                }
            });
        }
    
        if (createClientForm) {
            createClientForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const clientData = {
                    name: document.getElementById('new-client-name').value,
                };
    
                const result = await createClient(clientData); // Função de api.js
    
                if (result.success) {
                    createClientModal.style.display = 'none';
                    showNotification('Cliente criado com sucesso!', 'success');
                    initializeCRM(); // Recarrega os dados do CRM
                } else {
                    alert(`Erro: ${result.message}`);
                }
            });
        }
    }

    // Inicia tudo
    initializeCRM();
    setupCreateClientModal();
});