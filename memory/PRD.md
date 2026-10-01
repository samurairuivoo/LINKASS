# LinkChat — PRD

## Problem statement (original, PT)
"preciso que seja feito verificaçao e deixe meu site bem criativo que chame atençao e oculpe 1 lugar no lugar do discord melhore a infraestrutura" — usuário quer um site criativo, que chame atenção, que ocupe o lugar do Discord, com infraestrutura melhor. Enviou um projeto zip (link-chat) em TypeScript/tRPC/drizzle.

## Approach
Rebuilt the Discord-competitor as a clean full-stack app on the Emergent stack (FastAPI + MongoDB + Vite/React 19), preserving the original brand palette (cream #f7f3ed, dark green #14231e, coral #e78662; fonts Space Grotesk + DM Sans).

## Architecture
- Backend: /app/backend/server.py — all routes under /api. Session-token auth (cookie + Bearer) for both email/password and Emergent Google OAuth.
- Frontend: React Router; AuthContext; 3-column chat shell (ServerRail / ChannelSidebar / ChatArea / MemberList) + DM view. Real-time via 2.5s polling.
- Collections: users, user_sessions, servers, channels, messages, dm_conversations, dm_messages.

## User personas
- Comunidades, grupos de amigos, criadores que querem um espaço próprio de chat em tempo real.

## Core requirements (static)
- Auth email/senha + Google; perfis com avatar/status; servidores + canais + convites; chat em tempo real; imagens/arquivos; DMs; lista de membros com presença; visual criativo mantendo a paleta.

## Implemented (2026-06)
- [x] Landing page criativa (hero, features bento, CTA)
- [x] Auth email/senha + Google OAuth (Emergent) com split-screen
- [x] Perfil (nome, avatar base64, status, presença online)
- [x] Servidores: criar, listar, detalhe, convite por código, entrar
- [x] Canais de texto (geral/random padrão + criar)
- [x] Chat em tempo real (polling 2.5s) com anexos de imagem (base64)
- [x] Mensagens diretas entre usuários
- [x] Lista de membros com indicador online/offline
- Tested: 19/19 backend pytest + Playwright E2E, 100% pass.

## Backlog (prioritized)
- P0: Chamadas de voz nos canais de voz (próxima fase — WebRTC/LiveKit).
- P1: Reações e indicador "digitando..."; migrar anexos para object storage; índices Mongo.
- P1: Edição/exclusão de mensagens; roles/permissões de servidor.
- P2: Notificações, busca de mensagens, temas; WebSocket real-time em vez de polling.

## Next tasks
1. Pagamento real nos planos (Stripe) — hoje os planos são apenas de exibição (mensal/anual).
2. Vídeo nas chamadas de voz.
3. Verificação de idade no servidor (hoje é gate client-side 13+).

## Updates 2026-06 (correção chamadas — sem tela preta)
- Entrar na chamada agora usa **áudio primeiro** (sem tela preta); câmera e tela são opcionais.
- Via de vídeo pré-negociada (transceiver) → ligar câmera/compartilhar tela usa replaceTrack, sem renegociar.
- MediaTile mostra avatar por padrão e só exibe vídeo quando há faixa de vídeo ativa.
- Mensagens de erro específicas (permissão negada / sem microfone / preview embutido / sala cheia).
- Verificado: 7/7 backend + frontend 100% (iteração 8), sem tela preta, câmera e tela OK.

## Updates 2026-06 (chamadas + pagamentos + mídia)
- Stripe real (sandbox test): planos mensal/anual em BRL, checkout com locale pt-BR.
- Chamadas de voz/vídeo via WebRTC mesh com STUN **+ TURN (openrelay)** para conectar entre redes/NAT.
- Compartilhamento de tela (getDisplayMedia) e limite de **10 participantes por sala**.
- Chat: mensagens de **áudio** (gravação via MediaRecorder) e **vídeo**, com players inline.
- Verificação de idade (13+) exigida no cadastro (backend) + age gate na entrada.
- Logo oficial do usuário aplicada (login, landing, favicon). Banco de dados zerado (sem usuários fake).
- Testes: 50/50 backend + frontend 100% (iterações 5 e 6).
- Rebrand completo para "Linkas"; removidas todas as referências ao Discord.
- Recoloração para a paleta ORIGINAL do projeto (navy #070d22, gradiente #5948ff→#19a9ff, ciano).
- Landing reconstruída idêntica ao original (hero "Conecte-se através de um link", phones, Como funciona, Recursos, FAQ) + nova seção de Planos (mensal/anual, 3 tiers).
- Age Gate 13+ como tela inicial antes de acessar a plataforma (bloqueio para menores).
- Barra fixa no app para alternar entre Conversas e Servidores + botão Voltar ao site.
- Testes: 35/35 backend + frontend 100%.
