## 🧭 OneAgent - Starter Instructions for Copilot

Hei Copilot! OneAgent er nå klar for neste utviklingsfase. Her er det du må vite:

### 🎯 **Hovedmål**
OneAgent er en AI-agentplattform designet for å:
- Betjene mennesker gjennom kontekstuell hjelp
- Lære over tid gjennom lokal semantisk minne  
- Støtte ulike roller (rådgiver, assistent, coach osv.)
- Ha full dataprivacy og operere uten skyavhengighet

### 🧱 **BMAD-Arkitektur**
Agenten er bygget på fire domener:
- **B**ehavior: Atferd og beslutningstagning
- **M**emory: Kontekstuelt minne og søk (✅ FERDIG)
- **A**ction: Verktøy og API-bruk  
- **D**ialogue: Språklig samhandling og UI (🟡 NESTE STEG)

### 🛠️ **Tech Stack**
- **Backend**: TypeScript (Node.js), Python (memory server)
- **Frontend**: React, TypeScript, Vite
- **Memory**: ChromaDB + Gemini embeddings (✅ FUNGERER)
- **API**: Express.js + WebSocket (✅ FUNGERER)

### 📌 **Status per nå**
- ✅ **Memory System**: Fullstendig lokalt minne med semantisk søk
- ✅ **React UI**: Grunnlag med komponenter og hooks
- ✅ **API Integration**: REST endpoints og WebSocket
- ✅ **Performance Monitoring**: Sanntids overvåkning

### 🚀 **Neste oppgave: Chat Interface**

**Umiddelbare oppgaver:**
1. **Lag chat-komponenter** i `ui/src/components/chat/`
2. **Implementer samtalelogikk** med memory-integrasjon
3. **Koble til existing memory system** (`mem0Client.ts`)
4. **Bruk WebSocket** for sanntids chat

**Startfiler:**
- Se `ui/src/components/` for existing komponenter
- Bruk `coreagent/tools/mem0Client.ts` for memory
- WebSocket på `ws://localhost:8081`
- Memory server på `localhost:8000`

**Eksempel startfunkt:**
```bash
# Start memory server
python servers/gemini_mem0_server_v2.py

# Start UI (nytt terminal)
cd ui && npm run dev

# Test memory integration  
node tests/complete_integration_test.js
```

### 🎯 **Mål for denne fasen**
- Funksjonell chat-grensesnitt med sanntids samtale
- Memory-integrert kontekst i alle meldinger
- Grunnlag for BMAD-konfigurasjon
- Agent personlighet framework

**Alt er klart for å bygge den interaktive agenten på vårt solide memory-grunnlag!** 🚀

---

*Se `docs/LEVEL_2_DEVELOPMENT_PLAN.md` for detaljert implementeringsplan*
