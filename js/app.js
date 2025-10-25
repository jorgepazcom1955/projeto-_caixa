// Sistema PDV - Mercadinho Morezine
// Banco de dados local (localStorage)

// Dados iniciais
let produtos = JSON.parse(localStorage.getItem("produtos")) || [
    { id: "001", nome: "Arroz 5kg", preco: 22.90, estoque: 50, categoria: "alimentos", balanca: false },
    { id: "002", nome: "Feijão 1kg", preco: 8.50, estoque: 40, categoria: "alimentos", balanca: false },
    { id: "003", nome: "Maçã", preco: 8.99, estoque: 30, categoria: "alimentos", balanca: true },
    { id: "004", nome: "Carne Bovina", preco: 39.90, estoque: 20, categoria: "alimentos", balanca: true },
    { id: "005", nome: "Leite 1L", preco: 4.50, estoque: 60, categoria: "alimentos", balanca: false }
];

let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
let carrinhoAtual = [];
let metodoPagamento = "dinheiro";
let configSistema = JSON.parse(localStorage.getItem("configSistema")) || {
    impressora: { modelo: "epson", porta: "COM1" },
    balanca: { modelo: "toledo", porta: "COM2" },
    empresa: { nome: "Mercadinho Morezine", cnpj: "", endereco: "" }
};

// Inicialização do sistema
document.addEventListener("DOMContentLoaded", () => {
    // Verificar login
    if (!localStorage.getItem("logado")) {
        mostrarTelaLogin();
    } else {
        mostrarSistemaPrincipal();
    }

    // Configurar eventos
    configurarEventos();
    
    // Carregar dados iniciais
    carregarProdutos();
    carregarVendas();
    carregarConfiguracoes();
});

// Funções de navegação e interface
function mostrarTelaLogin() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("main-system").classList.add("hidden");
}

function mostrarSistemaPrincipal() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-system").classList.remove("hidden");
}

function mostrarPagina(pagina) {
    // Esconder todas as páginas
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    
    // Mostrar a página selecionada
    document.getElementById(`${pagina}-page`).classList.add("active");
    
    // Atualizar menu
    document.querySelectorAll(".menu li").forEach(item => {
        if (item.dataset.page === pagina) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

function mostrarModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// Configuração de eventos
function configurarEventos() {
    // Login
    document.getElementById("login-form").addEventListener("submit", fazerLogin);
    
    // Menu
    document.querySelectorAll(".menu li").forEach(item => {
        if (item.dataset.page) {
            item.addEventListener("click", () => mostrarPagina(item.dataset.page));
        }
    });
    
    document.getElementById("logout").addEventListener("click", fazerLogout);
    
    // PDV
    document.getElementById("search-btn").addEventListener("click", buscarProduto);
    document.getElementById("product-search").addEventListener("keypress", (e) => {
        if (e.key === "Enter") buscarProduto();
    });
    document.getElementById("balanca-btn").addEventListener("click", () => mostrarModal("balanca-modal"));
    document.getElementById("finalizar-venda").addEventListener("click", iniciarFinalizacaoVenda);
    document.getElementById("cancelar-venda").addEventListener("click", cancelarVenda);
    
    // Formas de pagamento
    document.querySelectorAll(".payment-btn").forEach(btn => {
        btn.addEventListener("click", () => selecionarFormaPagamento(btn.dataset.method));
    });
    
    // Estoque
    document.getElementById("add-product").addEventListener("click", () => {
        document.getElementById("produto-modal-title").textContent = "Novo Produto";
        document.getElementById("produto-form").reset();
        document.getElementById("produto-id").value = "";
        mostrarModal("produto-modal");
    });
    
    document.getElementById("estoque-search-btn").addEventListener("click", buscarProdutoEstoque);
    
    // Modais
    document.querySelectorAll(".close, .close-modal").forEach(el => {
        el.addEventListener("click", () => {
            document.querySelectorAll(".modal").forEach(modal => {
                modal.classList.remove("active");
            });
        });
    });
    
    // Salvar produto
    document.getElementById("save-produto").addEventListener("click", salvarProduto);
    
    // Balança
    document.getElementById("ler-balanca").addEventListener("click", lerBalanca);
    document.getElementById("add-balanca-item").addEventListener("click", adicionarItemBalanca);
    
    // Pagamento
    document.getElementById("valor-recebido").addEventListener("input", calcularTroco);
    document.getElementById("confirmar-pagamento").addEventListener("click", finalizarVenda);
    
    // Configurações
    document.getElementById("save-config").addEventListener("click", salvarConfiguracoes);
    
    // Relatórios
    document.getElementById("filter-btn").addEventListener("click", filtrarRelatorios);
}

// Funções de autenticação
function fazerLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    //const password = document.getElementById("password").value;
    
    // Autenticação simples apenas com usuário
    if (username.toLowerCase() === "admin") {
        localStorage.setItem("logado", "true");
        mostrarSistemaPrincipal();
        console.log("Login bem-sucedido!");
    } else {
        alert("Usuário incorreto! Use 'admin'");
        console.log("Falha no login - usuário incorreto");
    }
}

function fazerLogout() {
    localStorage.removeItem("logado");
    mostrarTelaLogin();
}

// Funções do PDV
function buscarProduto() {
    const busca = document.getElementById("product-search").value.trim();
    if (!busca) return;
    
    const produto = produtos.find(p => p.id === busca || p.nome.toLowerCase().includes(busca.toLowerCase()));
    
    if (produto) {
        adicionarAoCarrinho(produto, 1);
        document.getElementById("product-search").value = "";
    } else {
        alert("Produto não encontrado!");
    }
}

function adicionarAoCarrinho(produto, quantidade) {
    // Verificar se o produto já está no carrinho
    const itemExistente = carrinhoAtual.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
        itemExistente.subtotal = itemExistente.quantidade * itemExistente.produto.preco;
    } else {
        carrinhoAtual.push({
            produto: produto,
            quantidade: quantidade,
            subtotal: produto.preco * quantidade
        });
    }
    
    atualizarCarrinho();
}

function removerDoCarrinho(index) {
    carrinhoAtual.splice(index, 1);
    atualizarCarrinho();
}

function atualizarQuantidade(index, novaQuantidade) {
    if (novaQuantidade <= 0) {
        removerDoCarrinho(index);
        return;
    }
    
    carrinhoAtual[index].quantidade = novaQuantidade;
    carrinhoAtual[index].subtotal = novaQuantidade * carrinhoAtual[index].produto.preco;
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const tbody = document.getElementById("cart-body");
    tbody.innerHTML = "";
    
    let total = 0;
    
    carrinhoAtual.forEach((item, index) => {
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td>${item.produto.id}</td>
            <td>${item.produto.nome}</td>
            <td>
                <button class="btn-qty" onclick="atualizarQuantidade(${index}, ${item.quantidade - 1})">-</button>
                ${item.quantidade}
                <button class="btn-qty" onclick="atualizarQuantidade(${index}, ${item.quantidade + 1})">+</button>
            </td>
            <td>R$ ${item.produto.preco.toFixed(2)}</td>
            <td>R$ ${item.subtotal.toFixed(2)}</td>
            <td>
                <button class="btn-danger" onclick="removerDoCarrinho(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        total += item.subtotal;
    });
    
    document.getElementById("total-value").textContent = `R$ ${total.toFixed(2)}`;
}

function selecionarFormaPagamento(metodo) {
    metodoPagamento = metodo;
    
    document.querySelectorAll(".payment-btn").forEach(btn => {
        if (btn.dataset.method === metodo) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function iniciarFinalizacaoVenda() {
    if (carrinhoAtual.length === 0) {
        alert("Adicione produtos ao carrinho antes de finalizar a venda!");
        return;
    }
    
    const total = carrinhoAtual.reduce((sum, item) => sum + item.subtotal, 0);
    document.getElementById("modal-total").textContent = `R$ ${total.toFixed(2)}`;
    
    // Mostrar/esconder campos de acordo com o método de pagamento
    if (metodoPagamento === "dinheiro") {
        document.getElementById("dinheiro-row").style.display = "flex";
        document.getElementById("troco-row").style.display = "flex";
    } else {
        document.getElementById("dinheiro-row").style.display = "none";
        document.getElementById("troco-row").style.display = "none";
    }
    
    mostrarModal("pagamento-modal");
}

function calcularTroco() {
    if (metodoPagamento !== "dinheiro") return;
    
    const total = carrinhoAtual.reduce((sum, item) => sum + item.subtotal, 0);
    const valorRecebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
    const troco = valorRecebido - total;
    
    document.getElementById("troco-valor").textContent = troco >= 0 ? 
        `R$ ${troco.toFixed(2)}` : 
        "Valor insuficiente";
}

function finalizarVenda() {
    if (metodoPagamento === "dinheiro") {
        const total = carrinhoAtual.reduce((sum, item) => sum + item.subtotal, 0);
        const valorRecebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
        
        if (valorRecebido < total) {
            alert("Valor recebido é menor que o total da compra!");
            return;
        }
    }
    
    // Criar registro da venda
    const venda = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        itens: [...carrinhoAtual],
        total: carrinhoAtual.reduce((sum, item) => sum + item.subtotal, 0),
        pagamento: metodoPagamento
    };
    
    // Atualizar estoque
    carrinhoAtual.forEach(item => {
        const produtoIndex = produtos.findIndex(p => p.id === item.produto.id);
        if (produtoIndex >= 0 && !produtos[produtoIndex].balanca) {
            produtos[produtoIndex].estoque -= item.quantidade;
        }
    });
    
    // Salvar dados
    vendas.push(venda);
    localStorage.setItem("vendas", JSON.stringify(vendas));
    localStorage.setItem("produtos", JSON.stringify(produtos));
    
    // Imprimir cupom
    imprimirCupom(venda);
    
    // Limpar carrinho e fechar modal
    carrinhoAtual = [];
    atualizarCarrinho();
    fecharModal("pagamento-modal");
    
    alert("Venda finalizada com sucesso!");
}

function cancelarVenda() {
    if (confirm("Deseja realmente cancelar a venda atual?")) {
        carrinhoAtual = [];
        atualizarCarrinho();
    }
}

// Funções da balança
function lerBalanca() {
    // Simulação de leitura da balança
    const peso = (Math.random() * 5).toFixed(3);
    document.getElementById("balanca-peso").value = peso;
}

function adicionarItemBalanca() {
    const produtoId = document.getElementById("balanca-produto").value;
    const peso = parseFloat(document.getElementById("balanca-peso").value);
    
    if (!produtoId || isNaN(peso) || peso <= 0) {
        alert("Selecione um produto e informe o peso!");
        return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
        adicionarAoCarrinho(produto, peso);
        fecharModal("balanca-modal");
    }
}

// Funções de estoque
function carregarProdutos() {
    // Carregar produtos na tabela de estoque
    const tbody = document.getElementById("products-body");
    tbody.innerHTML = "";
    
    produtos.forEach((produto, index) => {
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.balanca ? "N/A" : produto.estoque}</td>
            <td>${produto.categoria}</td>
            <td>
                <button class="btn-primary" onclick="editarProduto(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="excluirProduto(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Carregar produtos na balança
    const selectBalanca = document.getElementById("balanca-produto");
    selectBalanca.innerHTML = "";
    
    produtos.filter(p => p.balanca).forEach(produto => {
        const option = document.createElement("option");
        option.value = produto.id;
        option.textContent = `${produto.nome} - R$ ${produto.preco.toFixed(2)}/kg`;
        selectBalanca.appendChild(option);
    });
}

function buscarProdutoEstoque() {
    const busca = document.getElementById("estoque-search").value.trim().toLowerCase();
    
    if (!busca) {
        carregarProdutos();
        return;
    }
    
    const produtosFiltrados = produtos.filter(p => 
        p.id.toLowerCase().includes(busca) || 
        p.nome.toLowerCase().includes(busca)
    );
    
    const tbody = document.getElementById("products-body");
    tbody.innerHTML = "";
    
    produtosFiltrados.forEach((produto, index) => {
        const produtoIndex = produtos.findIndex(p => p.id === produto.id);
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.balanca ? "N/A" : produto.estoque}</td>
            <td>${produto.categoria}</td>
            <td>
                <button class="btn-primary" onclick="editarProduto(${produtoIndex})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="excluirProduto(${produtoIndex})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function editarProduto(index) {
    const produto = produtos[index];
    
    document.getElementById("produto-modal-title").textContent = "Editar Produto";
    document.getElementById("produto-id").value = index;
    document.getElementById("produto-codigo").value = produto.id;
    document.getElementById("produto-nome").value = produto.nome;
    document.getElementById("produto-preco").value = produto.preco;
    document.getElementById("produto-estoque").value = produto.estoque;
    document.getElementById("produto-categoria").value = produto.categoria;
    document.getElementById("produto-balanca").checked = produto.balanca;
    
    mostrarModal("produto-modal");
}

function salvarProduto() {
    const index = document.getElementById("produto-id").value;
    const codigo = document.getElementById("produto-codigo").value.trim();
    const nome = document.getElementById("produto-nome").value.trim();
    const preco = parseFloat(document.getElementById("produto-preco").value);
    const estoque = parseInt(document.getElementById("produto-estoque").value);
    const categoria = document.getElementById("produto-categoria").value;
    const balanca = document.getElementById("produto-balanca").checked;
    
    if (!codigo || !nome || isNaN(preco) || (isNaN(estoque) && !balanca)) {
        alert("Preencha todos os campos corretamente!");
        return;
    }
    
    // Verificar se o código já existe (exceto para o produto atual)
    if (index === "" && produtos.some(p => p.id === codigo)) {
        alert("Já existe um produto com este código!");
        return;
    }
    
    const produto = {
        id: codigo,
        nome: nome,
        preco: preco,
        estoque: balanca ? 0 : estoque,
        categoria: categoria,
        balanca: balanca
    };
    
    if (index === "") {
        // Novo produto
        produtos.push(produto);
    } else {
        // Editar produto existente
        produtos[index] = produto;
    }
    
    localStorage.setItem("produtos", JSON.stringify(produtos));
    carregarProdutos();
    fecharModal("produto-modal");
}

function excluirProduto(index) {
    if (confirm("Deseja realmente excluir este produto?")) {
        produtos.splice(index, 1);
        localStorage.setItem("produtos", JSON.stringify(produtos));
        carregarProdutos();
    }
}

// Funções de relatórios
function carregarVendas() {
    const tbody = document.getElementById("vendas-body");
    tbody.innerHTML = "";
    
    // Ordenar vendas por data (mais recentes primeiro)
    const vendasOrdenadas = [...vendas].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    vendasOrdenadas.forEach((venda, index) => {
        const data = new Date(venda.data);
        const dataFormatada = `${data.toLocaleDateString()} ${data.toLocaleTimeString()}`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${venda.id}</td>
            <td>${dataFormatada}</td>
            <td>R$ ${venda.total.toFixed(2)}</td>
            <td>${formatarMetodoPagamento(venda.pagamento)}</td>
            <td>
                <button class="btn-primary" onclick="verDetalhesVenda(${index})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-success" onclick="reimprimirCupom(${index})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Atualizar cards de resumo
    atualizarResumoVendas(vendas);
}

function formatarMetodoPagamento(metodo) {
    switch(metodo) {
        case "dinheiro": return "Dinheiro";
        case "cartao-debito": return "Cartão de Débito";
        case "cartao-credito": return "Cartão de Crédito";
        case "pix": return "PIX";
        default: return metodo;
    }
}

function filtrarRelatorios() {
    const dataInicio = document.getElementById("date-start").value;
    const dataFim = document.getElementById("date-end").value;
    
    if (!dataInicio || !dataFim) {
        alert("Selecione as datas para filtrar!");
        return;
    }
    
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    
    const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= inicio && dataVenda <= fim;
    });
    
    const tbody = document.getElementById("vendas-body");
    tbody.innerHTML = "";
    
    vendasFiltradas.forEach((venda, index) => {
        const vendaIndex = vendas.findIndex(v => v.id === venda.id);
        const data = new Date(venda.data);
        const dataFormatada = `${data.toLocaleDateString()} ${data.toLocaleTimeString()}`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${venda.id}</td>
            <td>${dataFormatada}</td>
            <td>R$ ${venda.total.toFixed(2)}</td>
            <td>${formatarMetodoPagamento(venda.pagamento)}</td>
            <td>
                <button class="btn-primary" onclick="verDetalhesVenda(${vendaIndex})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-success" onclick="reimprimirCupom(${vendaIndex})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Atualizar cards de resumo
    atualizarResumoVendas(vendasFiltradas);
}

function atualizarResumoVendas(vendasList) {
    const totalVendas = vendasList.reduce((sum, venda) => sum + venda.total, 0);
    const qtdVendas = vendasList.length;
    const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;
    
    document.getElementById("total-vendas").textContent = `R$ ${totalVendas.toFixed(2)}`;
    document.getElementById("qtd-vendas").textContent = qtdVendas;
    document.getElementById("ticket-medio").textContent = `R$ ${ticketMedio.toFixed(2)}`;
}

function verDetalhesVenda(index) {
    const venda = vendas[index];
    let detalhes = `Venda #${venda.id}\n`;
    detalhes += `Data: ${new Date(venda.data).toLocaleString()}\n`;
    detalhes += `Método de Pagamento: ${formatarMetodoPagamento(venda.pagamento)}\n\n`;
    detalhes += "Itens:\n";
    
    venda.itens.forEach(item => {
        detalhes += `- ${item.produto.nome} x ${item.quantidade} = R$ ${item.subtotal.toFixed(2)}\n`;
    });
    
    detalhes += `\nTotal: R$ ${venda.total.toFixed(2)}`;
    
    alert(detalhes);
}

// Funções de configuração
function carregarConfiguracoes() {
    document.getElementById("printer-model").value = configSistema.impressora.modelo;
    document.getElementById("printer-port").value = configSistema.impressora.porta;
    document.getElementById("balanca-model").value = configSistema.balanca.modelo;
    document.getElementById("balanca-port").value = configSistema.balanca.porta;
    document.getElementById("empresa-nome").value = configSistema.empresa.nome;
    document.getElementById("empresa-cnpj").value = configSistema.empresa.cnpj;
    document.getElementById("empresa-endereco").value = configSistema.empresa.endereco;
}

function salvarConfiguracoes() {
    configSistema = {
        impressora: {
            modelo: document.getElementById("printer-model").value,
            porta: document.getElementById("printer-port").value
        },
        balanca: {
            modelo: document.getElementById("balanca-model").value,
            porta: document.getElementById("balanca-port").value
        },
        empresa: {
            nome: document.getElementById("empresa-nome").value,
            cnpj: document.getElementById("empresa-cnpj").value,
            endereco: document.getElementById("empresa-endereco").value
        }
    };
    
    localStorage.setItem("configSistema", JSON.stringify(configSistema));
    alert("Configurações salvas com sucesso!");
}

// Funções de impressão
function imprimirCupom(venda) {
    console.log("Imprimindo cupom...");
    console.log(venda);
    // Em um sistema real, aqui seria implementada a comunicação com a impressora
}

function reimprimirCupom(index) {
    imprimirCupom(vendas[index]);
    alert("Cupom reimpresso com sucesso!");
}
  lista.innerHTML = "";
  produtos.forEach(p => {
    const item = document.createElement("li");
    item.textContent = `[${p.tipo}] ${p.id} - ${p.nome} - R$ ${p.preco.toFixed(2)}`;
    lista.appendChild(item);
  });


mostrarProdutos();




const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { error } = require("console");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./produtos.db");

db.run(`CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  nome TEXT,
  preco REAL,
  tipo TEXT
)`);

app.post("/cadastrar", (req, res) => {
  const { id, nome, preco, tipo } = req.body;
  db.run(`INSERT INTO produtos (id, nome, preco, tipo) VALUES (?, ?, ?, ?)`,
    [id, nome, preco, tipo],
    err => {
      if (err) return res.status(500).send("Erro ao cadastrar");
      res.send("Produto cadastrado com sucesso");
    }
  );
});



function cadastrarProduto() {
  const tipo = document.getElementById("tipo-codigo").value;
  const id = document.getElementById("codigo-produto").value.trim();
  const nome = document.getElementById("nome-produto").value.trim();
  const preco = parseFloat(document.getElementById("preco-produto").value);

  if (!id || !nome || isNaN(preco)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  fetch("http://localhost:3000/cadastrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, nome, preco, tipo })
  })
  .then(res => res.text())
  .then(msg => {
    alert(msg);
    document.getElementById("form-produto").reset();
    mostrarProdutos();
  });
}


app.listen(3001, () => console.log("Servidor rodando na porta 3001"));
function mostrarProdutos() {
  const lista = document.getElementById("lista-produtos");
  lista.innerHTML = "";
  produtos.forEach(p => {
    const item = document.createElement("li");
    item.textContent = `[${p.tipo}] ${p.id} - ${p.nome} - R$ ${p.preco.toFixed(2)}`;
    lista.appendChild(item);
  });
}

function mostrarProdutos() {
  fetch("http://localhost:3000/produtos")
    .then(res => res.json())
    .then(produtos => {
      const lista = document.getElementById("lista-produtos");
      lista.innerHTML = "";
      produtos.forEach(p => {
        const item = document.createElement("li");
        item.textContent = `[${p.tipo}] ${p.id} - ${p.nome} - R$ ${p.preco.toFixed(2)}`;
        lista.appendChild(item);
      });
    });
}
localStorage.clear(); // Apaga tudo
// ou
localStorage.removeItem("nomeDaChave"); // Apaga só uma chave

// Buscar produto por código
function buscarProduto() {
  const codigo = document.getElementById("buscaCodigo").value.trim();
  const produto = produtos.find(p => p.codigo === codigo);

  const resultado = document.getElementById("resultadoBusca");
  if (produto) {
    resultado.textContent = `Produto: ${produto.nome} | Preço: R$ ${produto.preco.toFixed(2)}`;
  } else {
    resultado.textContent = "Produto não encontrado.";
  }
}

// Simular balança (cálculo por peso)
function calcularPrecoPorPeso() {
  const codigo = document.getElementById("codigoPeso").value.trim();
  const peso = parseFloat(document.getElementById("peso").value);
  const produto = produtos.find(p => p.codigo === codigo);

  const resultado = document.getElementById("resultadoPeso");
  if (produto && !isNaN(peso)) {
    const total = produto.preco * peso;
    resultado.textContent = `Total a pagar: R$ ${total.toFixed(2)} (${peso}kg de ${produto.nome})`;
  } else {
    resultado.textContent = "Produto não encontrado ou peso inválido.";
  }
}
//Caixa
function calcularTroco() {
  const compra = parseFloat(document.getElementById("valor-compra").value);
  const pago = parseFloat(document.getElementById("valor-pago").value);
  const forma = document.getElementById("forma-pagamento").value;
  const resultado = document.getElementById("resultado-troco");

  if (isNaN(compra) || isNaN(pago)) {
    resultado.innerText = "Preencha os valores corretamente.";
    return;
  }

  const troco = pago - compra;
  if (troco >= 0) {
    resultado.innerHTML = `
      🧾 Venda registrada com sucesso!<br>
      Forma de pagamento: <strong>${forma}</strong><br>
      Troco: R$ ${troco.toFixed(2)}
    `;
  } else {
    resultado.innerText = `Valor insuficiente. Faltam R$ ${Math.abs(troco).toFixed(2)}.`;
  }
}

function imprimirRecibo() {
  const recibo = document.getElementById("recibo");

  // 🕒 Gerar data e hora atual
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString("pt-BR");
  const horaFormatada = agora.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  
    // 🧾 Atualizar no recibo
    document.getElementById("data-hora").textContent = `${dataFormatada} ${horaFormatada}`;
  
    // Mostrar e imprimir
    recibo.style.display = "block";
    setTimeout(() => {
      window.print();
      recibo.style.display = "none";
    }, 100);
  }
  // 🧾 Atualizar no recibo
  document.getElementById("data-hora").textContent = `${dataFormatada} ${horaFormatada}`;
  
  // Imprimir
  imprimirRecibo();












