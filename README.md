# **The Shortener**

Projeto backend para encurtamento de URLs construído com **NestJS**, estruturado em camadas e módulos independentes. O sistema inclui autenticação, gerenciamento de usuários, criação e manipulação de URLs encurtadas, processamento assíncrono com filas, integração com Postgres e serviços de notificação.

---

## **1. Introdução**

**The Shortener** é uma API modular desenvolvida com o objetivo de fornecer um serviço robusto de encurtamento de URLs. O projeto segue princípios de arquitetura limpa (Clean Architecture / Hexagonal), separando responsabilidades em camadas **domain**, **application** e **infra**.

Entre as funcionalidades principais estão:

- Criação, atualização, listagem e remoção de URLs encurtadas.
- Autenticação com JWT.
- Envio assíncrono de notificações via filas.
- Módulos independentes e facilmente extensíveis.

A estrutura modular do NestJS facilita a injeção de dependências, testes unitários e manutenção do código.

---

## **2. Configuração de variáveis de ambiente**

O projeto utiliza variáveis de ambiente para configuração de serviços externos e parâmetros da aplicação. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

### **Variáveis obrigatórias**

```bash
# PostgreSQL - Banco de dados principal
PG_HOST=localhost                     # Host do servidor PostgreSQL
PG_PORT=5432                          # Porta do PostgreSQL (padrão: 5432)
PG_NAME=shortener_db                  # Nome do banco de dados
PG_USER=postgres                      # Usuário do PostgreSQL
PG_PASS=sua_senha_postgres            # Senha do usuário PostgreSQL

# Redis - Cache e gerenciamento de filas
REDIS_HOST=localhost                  # Host do servidor Redis
REDIS_PORT=6379                       # Porta do Redis (padrão: 6379)
REDIS_USERNAME=                       # Usuário Redis (deixe vazio se não houver autenticação)
REDIS_PASS=                           # Senha Redis (deixe vazio se não houver autenticação)

# Aplicação
PORT=3000                             # Porta em que a aplicação será executada
NODE_ENV=DEVELOPMENT                  # Ambiente: DEVELOPMENT, PRODUCTION
APP_URL=http://localhost:3000         # URL pública da aplicação

# Segurança
ENCODE_SECRET=sua_chave_secreta_aqui  # Chave secreta para JWT e criptografia (gere uma string aleatória segura)

# Internacionalização
TEMPLATE_LANGUAGE=PT-BR               # Idioma padrão dos templates

# Usuário administrador inicial
ROOT_USER_NAME=admin                  # Nome do usuário root
ROOT_USER_PASS=senha_segura           # Senha do usuário root (altere após primeiro acesso)
ROOT_USER_EMAIL=admin@example.com     # Email do usuário root

# SMTP - Envio de emails
SMTP_EMAIL=seu_email@gmail.com        # Email usado para enviar notificações
SMTP_PASS=sua_senha_app_smtp          # Senha do email ou senha de aplicativo
```

#### **SMTP (SMTP_EMAIL, SMTP_PASS)**

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de app" em: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use essa senha gerada em `SMTP_PASS`

## **3. Como iniciar a aplicação**

### **Pré-requisitos**

- **Node.js >= 18** (recomendado LTS).
- **npm >= 9**, **yarn** ou **pnpm**.
- **PostgreSQL** em execução.
- **Redis** (necessário para filas; opcional no ambiente de desenvolvimento).

---

### **Configuração inicial**

```bash
npm run setup
```

Esse script instala dependências, gera o build inicial e prepara o ambiente.

---

### **Rodando em ambiente de desenvolvimento**

Iniciar API:

```bash
npm run start:dev
```

Iniciar worker (filas):

```bash
npm run start:worker:dev
```

Ambos em paralelo:

```bash
npm run start:both
```

---

### **Build e produção**

Gerar o build:

```bash
npm run build
```

Rodar API em produção:

```bash
npm run start:prod
```

Rodar API + worker:

```bash
npm run start
```

Rodar apenas o worker:

```bash
npm run start:worker
```

---

### **Migrações e seed**

```bash
npm run migration:run        # Executa migrações pendentes
npm run migration:rollback   # Desfaz última migração
npm run seed                 # Insere dados iniciais
```

---

## **4. Scripts disponíveis**

| Script                       | Descrição                               |
| ---------------------------- | --------------------------------------- |
| `npm run setup`              | Configuração inicial do projeto         |
| `npm run build`              | Compila o projeto com Nest              |
| `npm run format`             | Executa Prettier                        |
| `npm run start`              | Produção (API + Worker)                 |
| `npm run start:both`         | Execução simultânea de API e worker     |
| `npm run start:prod`         | Inicia o build compilado                |
| `npm run start:worker`       | Worker em produção                      |
| `npm run start:dev`          | API em modo desenvolvimento             |
| `npm run start:worker:dev`   | Worker em modo desenvolvimento          |
| `npm run start:debug`        | Debug mode                              |
| `npm run lint`               | Executa ESLint                          |
| `npm test`                   | Testes unitários                        |
| `npm run test:watch`         | Testes em modo watch                    |
| `npm run test:cov`           | Gera relatório de coverage              |
| `npm run commit`             | Commitizen para padronização de commits |
| `npm run docker:compose`     | Executa Docker Compose                  |
| `npm run migration:run`      | Executa migrações                       |
| `npm run migration:rollback` | Desfaz migrações                        |
| `npm run seed`               | Executa seed inicial                    |

---

## **5. Arquitetura do projeto**

Estrutura simplificada:

```
src/
  app.module.ts
  main.ts
  queue-worker.ts
  modules/
    auth/
    short-url/
    users/
  shared/
    infra/
    common/
    domain-events/
    ports/
    utils/
test/
```

---

### **Camadas**

- **Controllers (Interface / HTTP)**
  Pontos de entrada da aplicação (rotas).

- **Application / Services**
  Contêm casos de uso e regras de orquestração.

- **Domain**
  Entidades, regras de negócio puras e eventos de domínio.

- **Infra / Adapters**
  Implementações concretas: Postgres, Redis, email, filas, mapeamentos ORM, etc.

- **Shared / Common**
  Utilidades, validações, erros padronizados, helpers, eventos compartilháveis.

---

### **Padrões utilizados**

- Modularização do NestJS.
- Clean Architecture / Hexagonal Architecture.
- Injeção de dependências.
- Separação clara entre domínio e infraestrutura.
- Uso de filas para operações assíncronas.

---

## **6. Funcionamento interno**

### **Fluxo geral**

1. **Controllers** recebem a requisição.
2. Encaminham para **Services / Application**, que:
   - Validam regras.
   - Interagem com **Entities** do domínio.
   - Chamam **repositórios**.

3. **Adapters** implementam o acesso a:
   - Banco Postgres.
   - Redis.
   - Filas.
   - Email / notificações.

4. Eventos de domínio notificam partes da aplicação quando ações importantes ocorrem.

---

### **Migrações**

Localizadas em:

```
src/shared/infra/database/pg/migrations
```

---

## **7. Documentação da API**

O Swagger está disponível em:

```
/api/docs
```

Inclui todos os endpoints públicos, modelos, DTOs e exemplos de requisição/resposta.

---
