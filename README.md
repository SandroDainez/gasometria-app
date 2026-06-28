# Gasometria App

Ferramenta de **apoio à decisão clínica** para interpretação de gasometria arterial e venosa.
Calcula e classifica distúrbios ácido-base, avalia compensação fisiológica, anion gap (com correção
por albumina), relação delta-delta, oxigenação (PaO₂/FiO₂ e gradiente alvéolo-arterial) e sugere condutas
baseadas em diretrizes (Marino's ICU Book, West, ATS/ERS).

> ⚠️ **Aviso:** ferramenta educacional e de apoio. **Não substitui o julgamento clínico**, o exame do
> paciente, nem a correlação com história e demais exames. A responsabilidade pela conduta é sempre do
> profissional assistente.

## Funcionalidades

- **Interpretação ácido-base completa:** distúrbio primário, distúrbios mistos e subdistúrbios.
- **Compensação fisiológica:** fórmula de Winters, compensação esperada para alcalose metabólica e
  resposta renal aguda × crônica × agudizada sobre crônica nos distúrbios respiratórios.
- **Anion Gap:** cálculo, correção por albumina (Figge) e relação delta-delta (HAGMA/NAGMA/alcalose associada).
- **Oxigenação (arterial):** relação PaO₂/FiO₂ e gradiente A-a com valor esperado para a idade.
- **Alertas de segurança:** ex. gasometria venosa não avalia oxigenação pulmonar; perfis laboratoriais incompatíveis.
- **Leitura por câmera/OCR:** Tesseract.js local ou Gemini Vision (chave própria). Os valores lidos são
  sempre levados ao formulário editável para conferência/correção antes da interpretação.
- **Histórico local:** exames salvos no `localStorage` do navegador.

## Stack

React 19 · TypeScript · Vite · Tesseract.js · Lucide.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # checagem de tipos (tsc) + build de produção
npm run lint     # oxlint
```

## Estrutura

- `src/utils/clinicalMath.ts` — motor de interpretação (todas as fórmulas clínicas).
- `src/utils/ocrParser.ts` — parsing do texto do OCR local.
- `src/components/` — UI (entrada, scanner, resultados, histórico).
- `src/types.ts` — tipos compartilhados.
