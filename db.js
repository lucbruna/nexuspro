/**
 * NexusPro — Database Layer
 * JSON-based database com queries, índices e seed automático
 */
"use strict";
const fs   = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive:true });

class Collection {
  constructor(name) {
    this.name = name;
    this.file = path.join(DATA_DIR, `${name}.json`);
    this._data = this._load();
  }
  _load() { try { if (fs.existsSync(this.file)) return JSON.parse(fs.readFileSync(this.file,"utf8")); } catch(_){} return []; }
  _save() { try { fs.writeFileSync(this.file, JSON.stringify(this._data,null,2)); } catch(e){ console.error(`[DB] ${this.name}:`, e.message); } }
  _uid()  { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

  find(query={}) {
    return this._data.filter(item=>Object.entries(query).every(([k,v])=>{
      if (typeof v==="object"&&v!==null) {
        if (v.$gte!==undefined) return item[k]>=v.$gte;
        if (v.$lte!==undefined) return item[k]<=v.$lte;
        if (v.$like!==undefined) return String(item[k]||"").toLowerCase().includes(v.$like.toLowerCase());
        if (v.$in!==undefined)  return v.$in.includes(item[k]);
      }
      return item[k]===v;
    }));
  }
  findOne(q) { return this.find(q)[0]||null; }
  findById(id){ return this._data.find(x=>x.id===id)||null; }

  insert(doc) {
    const item={id:this._uid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...doc};
    this._data.unshift(item); this._save(); return item;
  }
  update(id,changes) {
    const idx=this._data.findIndex(x=>x.id===id); if(idx===-1) return null;
    this._data[idx]={...this._data[idx],...changes,id,updatedAt:new Date().toISOString()};
    this._save(); return this._data[idx];
  }
  delete(id) { const idx=this._data.findIndex(x=>x.id===id); if(idx===-1) return false; this._data.splice(idx,1); this._save(); return true; }
  deleteMany(q){ const ids=this.find(q).map(x=>x.id); this._data=this._data.filter(x=>!ids.includes(x.id)); this._save(); return ids.length; }
  count(q={}) { return this.find(q).length; }
  get all()   { return [...this._data]; }
  get length(){ return this._data.length; }
}

class Database {
  constructor() {
    this.users      = new Collection("users");
    this.clientes   = new Collection("clientes");
    this.transacoes = new Collection("transacoes");
    this.mensagens  = new Collection("mensagens");
    this.campanhas  = new Collection("campanhas");
    this.kanban     = new Collection("kanban");
    this.atividades = new Collection("atividades");
    this.notificacoes=new Collection("notificacoes");
    this.templates  = new Collection("templates");
    this.settings   = new Collection("settings");
    this.chatIA     = new Collection("chat_ia");
    this.planilhas  = new Collection("planilhas");
    this.tarefas    = new Collection("tarefas");
    this.produtos   = new Collection("produtos");
    this.rh         = new Collection("rh");
    this.emails     = new Collection("emails");
    this.contabilidade=new Collection("contabilidade");
    this.notas_fiscais=new Collection("notas_fiscais");
    this.advocacia = new Collection("advocacia");
    this.agenda = new Collection("agenda");
    this._seed();
  }

  log(userId,tipo,descricao,dados={}) { this.atividades.insert({userId,tipo,descricao,dados}); }

  async _seed() {
    if (this.users.count()===0) {
      const h = await bcrypt.hash("nexus123",10);
      this.users.insert({nome:"Administrador",   email:"admin@nexuspro.com",        senha:h,role:"super_admin",ativo:true,avatar:"AD",cor:"#6366f1"});
      this.users.insert({nome:"João Financeiro", email:"financeiro@nexuspro.com",   senha:h,role:"financeiro", ativo:true,avatar:"JF",cor:"#22c55e"});
      this.users.insert({nome:"Maria Atendimento",email:"atendimento@nexuspro.com",senha:h,role:"atendimento",ativo:true,avatar:"MA",cor:"#06b6d4"});
    }
    if (this.settings.count()===0) {
      this.settings.insert({key:"empresa",nomeEmpresa:"NexusPro Gestão",cnpj:"00.000.000/0001-00",email:"contato@nexuspro.com",telefone:"11900000000",endereco:"Av. Paulista, 1000 — São Paulo/SP",anthropicKey:"",openaiKey:"",minDelay:3,maxDelay:8,whatsappAtivo:false});
    }
    if (this.clientes.count()===0) {
      const hoje=new Date();
      [["Alpha Ltda","11999991111","alpha@mail.com","Pro",1500,"ativo","em_dia","São Paulo","Tecnologia"],
       ["Beta ME","21988882222","beta@mail.com","Basic",800,"ativo","atrasado","Rio de Janeiro","Comércio"],
       ["Gamma S/A","31977773333","gamma@mail.com","Premium",3000,"ativo","em_dia","BH","Serviços"],
       ["Delta Ltda","41966664444","delta@mail.com","Pro",1500,"ativo","vencendo","Curitiba","Indústria"],
       ["Epsilon Tech","51955555555","eps@mail.com","Basic",800,"inativo","em_dia","POA","Tecnologia"],
       ["Zeta Consult","61944446666","zeta@mail.com","Premium",3000,"ativo","em_dia","Brasília","Consultoria"],
       ["Eta Varejo","71933337777","eta@mail.com","Pro",1500,"ativo","atrasado","Salvador","Comércio"],
       ["Theta Saúde","81922228888","theta@mail.com","Premium",3000,"ativo","em_dia","Recife","Saúde"],
      ].forEach(([nome,tel,email,plano,valor,status,sit,cidade,seg])=>{
        const venc=new Date(hoje); venc.setDate(Math.floor(Math.random()*28)+1);
        if(sit==="atrasado") venc.setMonth(venc.getMonth()-1);
        this.clientes.insert({nome,telefone:tel,email,cpfCnpj:"",plano,valor,status,dataVencimento:venc.toISOString().split("T")[0],dataCadastro:new Date(hoje-Math.random()*365*86400000).toISOString().split("T")[0],cidade,segmento:seg,pagamentos:[],tags:[],score:Math.floor(Math.random()*40+60)});
      });
    }
    if (this.transacoes.count()===0) {
      const hoje=new Date();
      for(let m=0;m<6;m++){
        const d=new Date(hoje); d.setMonth(d.getMonth()-m);
        const ano=d.getFullYear(),mes=String(d.getMonth()+1).padStart(2,"0");
        [1500,3000,800,1500,3000,800].forEach((v,i)=>this.transacoes.insert({tipo:"entrada",categoria:"Mensalidade",descricao:`Mensalidade Cliente ${i+1}`,valor:v,data:`${ano}-${mes}-${String(Math.floor(Math.random()*25)+1).padStart(2,"0")}`,status:"pago",clienteId:""}));
        [{v:3500,c:"Aluguel"},{v:1200,c:"Folha"},{v:300,c:"Internet"},{v:200,c:"Energia"}].forEach(({v,c})=>this.transacoes.insert({tipo:"saida",categoria:c,descricao:c,valor:v,data:`${ano}-${mes}-05`,status:"pago",clienteId:""}));
      }
    }
    if (this.kanban.count()===0) {
      [{titulo:"Empresa XYZ — Software",valor:5000,coluna:"prospeccao",responsavel:"João Silva",prioridade:"alta",prazo:"2025-03-15"},
       {titulo:"ABC Corp — Consultoria",valor:12000,coluna:"qualificacao",responsavel:"Ana Costa",prioridade:"media",prazo:"2025-03-20"},
       {titulo:"Startup Beta — Licença",valor:8500,coluna:"proposta",responsavel:"Carlos Lima",prioridade:"alta",prazo:"2025-03-10"},
       {titulo:"Industrial SA — Suporte",valor:3000,coluna:"negociacao",responsavel:"João Silva",prioridade:"baixa",prazo:"2025-04-01"},
       {titulo:"Clínica Saúde — Sistema",valor:15000,coluna:"fechado_ganho",responsavel:"Ana Costa",prioridade:"alta",prazo:"2025-02-28"},
      ].forEach(c=>this.kanban.insert({...c,descricao:"",contato:"",empresa:"",tags:[]}));
    }
    if (this.templates.count()===0) {
      [{nome:"Boas-vindas",categoria:"onboarding",conteudo:"Olá {{nome}}! Bem-vindo(a) à nossa empresa! 🎉"},
       {nome:"Cobrança Amigável",categoria:"cobranca",conteudo:"Olá {{nome}}, sua mensalidade de {{valor}} está em aberto. Podemos ajudar? 😊"},
       {nome:"Cobrança Urgente",categoria:"cobranca",conteudo:"⚠️ {{nome}}, sua mensalidade de {{valor}} está {{diasAtraso}} dias em atraso."},
       {nome:"Lembrete Vencimento",categoria:"lembrete",conteudo:"Lembrete: sua mensalidade de {{valor}} vence em {{vencimento}}. 📅"},
       {nome:"Pesquisa NPS",categoria:"satisfacao",conteudo:"{{nome}}, de 0 a 10, quanto nos recomendaria? Sua opinião é valiosa! ⭐"},
      ].forEach(t=>this.templates.insert(t));
    }
    if (this.produtos.count()===0) {
      [{nome:"Notebook Dell",codigo:"NB-001",categoria:"Informática",quantidade:15,preco:4500,validade:""},
       {nome:"Monitor 27\"",codigo:"MN-001",categoria:"Informática",quantidade:8,preco:1800,validade:""},
       {nome:"Cadeira Ergonômica",codigo:"CD-001",categoria:"Mobiliário",quantidade:5,preco:2500,validade:""},
       {nome:"Mouse Sem Fio",codigo:"MS-001",categoria:"Informática",quantidade:30,preco:120,validade:""},
       {nome:"Papel A4 (cx)",codigo:"PP-001",categoria:"Papelaria",quantidade:50,preco:180,validade:""},
      ].forEach(p=>this.produtos.insert(p));
    }
    if (this.rh.count()===0) {
      [{nome:"Ana Silva",cargo:"Analista Financeiro",departamento:"Financeiro",salario:5200,admissao:"2024-03-15",telefone:"11988887777",email:"ana@nexuspro.com",documentos:"CPF,RG"},
       {nome:"Carlos Oliveira",cargo:"Desenvolvedor",departamento:"TI",salario:7800,admissao:"2024-01-10",telefone:"11977776666",email:"carlos@nexuspro.com",documentos:"CPF,RG,CNH"},
       {nome:"Mariana Costa",cargo:"Analista de RH",departamento:"RH",salario:4800,admissao:"2024-06-01",telefone:"11966665555",email:"mariana@nexuspro.com",documentos:"CPF,RG"},
      ].forEach(f=>this.rh.insert(f));
    }
    if (this.contabilidade.count()===0) {
      [{tipo:"receita",descricao:"Prestação de Serviços",valor:25000,data:"2026-05-10",categoria:"Serviços",conta:"Banco Itaú"},
       {tipo:"despesa",descricao:"Aluguel",valor:3500,data:"2026-05-05",categoria:"Imóvel",conta:"Conta Corrente"},
       {tipo:"despesa",descricao:"Folha de Pagamento",valor:15000,data:"2026-05-01",categoria:"Pessoal",conta:"Conta Corrente"},
      ].forEach(c=>this.contabilidade.insert(c));
    }
    if (this.advocacia.count()===0) {
      this.advocacia.insert({
        categoria:"processo",
        numero:"0001234-56.2026.8.26.0100",
        cliente:"Cliente Exemplo Ltda",
        parteContraria:"Fornecedor Alfa",
        area:"Civel",
        classe:"Acao de cobranca",
        tribunal:"TJSP",
        comarca:"Sao Paulo",
        vara:"1 Vara Civel",
        fase:"Conhecimento",
        status:"andamento",
        rito:"Comum",
        valorCausa:25000,
        prazo:"2026-06-10",
        responsavel:"Advogado responsavel",
        objeto:"Cobranca contratual com documentos anexos.",
        estrategia:"Consolidar provas documentais, calcular saldo e propor acordo antes da audiencia.",
        risco:"medio",
        proximaAcao:"Protocolar manifestacao e conferir documentos faltantes.",
        documentos:"Contrato, notas fiscais, comprovantes e e-mails.",
        andamento:"Processo distribuido e aguardando citacao.",
      });
      this.advocacia.insert({
        categoria:"peticao",
        titulo:"Peticao inicial - cobranca",
        modelo:"inicial",
        cliente:"Cliente Exemplo Ltda",
        parteContraria:"Fornecedor Alfa",
        conteudo:"EXCELENTISSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A)\n\nMinuta inicial de cobranca contratual.",
        status:"rascunho",
      });
    }
  }
}

module.exports = new Database();
