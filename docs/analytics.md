# Analytics da inscricao — GA4

O codigo mede o funil de inscricao oficial. A propriedade Google precisa das
configuracoes abaixo; elas nao sao alteradas pelo deploy do site.

## 1. Configuracao do build

No ambiente que gera o build de producao:

```dotenv
VITE_GA_MEASUREMENT_ID=G-8RVHDE36SW
VITE_GA_DEBUG=false
VITE_API_URL=https://beerrunapi.aurasoftware.com.br
```

Confira se esse ID corresponde ao fluxo Web da sua propriedade. As variaveis
VITE sao incorporadas no build: alterar depois exige gerar e publicar novamente.
Nao coloque segredo da API do GA4 ou credenciais de servidor no frontend.

Em desenvolvimento e localhost a coleta fica desativada por padrao. Para conferir
eventos reais no DebugView, use temporariamente `VITE_GA_DEBUG=true` com um ID
valido, preferencialmente de uma propriedade de teste, e reinicie o Vite.
Nao publique com debug ativado. Os testes automatizados bloqueiam a rede externa.

## 2. Configuracao obrigatoria no fluxo Web

Em Administrador > Fluxos de dados > seu fluxo Web, desative a **Medicao
otimizada** deste fluxo. O codigo envia os pageviews e os eventos de inscricao
manualmente. Isso evita duplicacao por navegacao e coleta automatica de links,
formularios e pesquisas com identificadores. Se o fluxo for compartilhado por
outros sites, use um fluxo dedicado e ajuste o ID do build.

`send_page_view: false` no codigo, sozinho, nao desativa os pageviews por mudancas
no historico habilitados no painel do GA4. Nao acrescente outra tag no HTML ou no
GTM para os mesmos eventos. Confira tambem se existem tags externas adicionais.

As paginas publicas sao registradas como `/` e `/inscricao`. Query strings e
fragmentos sao removidos da URL de medicao; o referrer externo preserva somente
a origem. UTMs e identificadores de anuncio nao sao encaminhados explicitamente
por esta instrumentacao. Nao use este funil como validacao de atribuicao de
campanhas sem uma configuracao especifica para campanhas.

O retorno `/pagamento-concluido` nao inicializa o GA, e os eventos manuais tambem
sao bloqueados nessa rota. A navegacao para `#staff` suspende a coleta da tag.
O resumo de pagamento exibido dentro da inscricao registra somente a ida ao
checkout, sem os dados privados do pedido.

## 3. Eventos disponiveis

Os eventos abaixo recebem `fluxo=inscricao_oficial`.

| Evento | Momento e parametros principais |
|---|---|
| `inscricao_visualizada` | Entrada na tela de inscricao |
| `inscricao_consulta` | Consulta do celular: `origem` manual/link e `resultado` tentativa/localizado/nao_encontrado/pedido_existente/status_disponivel/erro; nunca o celular |
| `inscricao_inicio` | Inicio ou retomada: `retomada` sim/nao e `etapa` |
| `inscricao_etapa_visualizada` | Cada entrada numa etapa: `etapa` de 1 a 5 |
| `inscricao_etapa_concluida` | Validacao ao avancar; etapa 5 ao enviar; etapa 3 inclui modalidade, camiseta, espetinhos e chopp |
| `inscricao_erro` | Erro mostrado ao visitante: `etapa`, quando aplicavel, e `tipo_erro` |
| `inscricao_cupom` | `resultado` tentativa/aplicado/formato_invalido/rejeitado/indisponivel; desconto aplicado em reais; nunca o codigo |
| `submit_inscricao_oficial` | Envio valido para a API; modalidade, camiseta, espetinhos, chopp e com_cupom |
| `conversao_inscricao_oficial_sucesso` | API devolveu pedido salvo/recuperado; kit, com_cupom, value, desconto e currency=BRL |
| `inscricao_checkout` | Link de checkout validado, imediatamente antes de sair para a InfinitePay |

Etapas: **1** identificacao; **2** contato/emergencia; **3** kit;
**4** regulamento; **5** resumo/pagamento.

`tipo_erro`: validacao, consulta, conflito (409), limite (429), servico (5xx),
conexao (falha sem status HTTP reconhecido). Mensagens de erro nao sao enviadas.
Resultados de consultas/cupons desatualizados nao devem ser usados para contar
conversoes; use os resultados finais, nao `tentativa`, para medir sucesso.

O evento de pedido salvo NAO representa pagamento confirmado. `value` e o valor
do pedido em reais, calculado pela API, nao receita recebida. Nao existe `purchase`
nem medicao de pagamento confirmado neste escopo. Para receita, use o backend
e a confirmacao verificada da InfinitePay; abrir o retorno nao comprova pagamento.

Pedidos repetidos sao deduplicados por ID apenas dentro da sessao do navegador
(com fallback em memoria). O ID nunca e enviado ao GA. Outra aba/navegador pode
contar novamente: a contagem nao substitui os totais do banco. As demais etapas
contam novas visitas/avancos, inclusive quando o usuario volta para editar.

## 4. Dimensoes e metricas personalizadas

Em Administrador > Definicoes personalizadas, crie dimensoes com escopo **Evento**
e os nomes de parametros exatos abaixo:

| Nome sugerido | Parametro |
|---|---|
| Fluxo | `fluxo` |
| Etapa da inscricao | `etapa` |
| Retomada de rascunho | `retomada` |
| Origem da acao | `origem` |
| Resultado | `resultado` |
| Tipo de erro | `tipo_erro` |
| Modalidade | `modalidade` |
| Camiseta | `camiseta` |
| Espetinhos | `espetinhos` |
| Chopp | `chopp` |
| Com cupom | `com_cupom` |

Para desconto, crie uma metrica personalizada `desconto` com unidade Moeda/BRL,
sem classifica-la como receita. Analise valores somente no evento desejado:
somar descontos de tentativas/cupons e de pedidos juntos duplicaria valores.
As definicoes podem levar 24–48 horas para ficar disponiveis nos relatorios.

Em Administrador > Eventos, marque **somente**
`conversao_inscricao_oficial_sucesso` como evento principal deste funil.
Nao marque a tentativa de envio como conversao. Os eventos antigos da
pre-inscricao (`sign_up`, `conversao_inscricao_sucesso`) sao de outro fluxo;
nao some ambos para contar inscricoes oficiais.

## 5. Exploracao de funil

Em Explorar > Exploracao de funil, crie etapas indiretamente seguidas por:

1. `inscricao_visualizada`.
2. `inscricao_inicio`.
3. `inscricao_etapa_visualizada` com `etapa=1`.
4. `inscricao_etapa_visualizada` com `etapa=2`.
5. `inscricao_etapa_visualizada` com `etapa=3`.
6. `inscricao_etapa_visualizada` com `etapa=4`.
7. `inscricao_etapa_visualizada` com `etapa=5`.
8. `conversao_inscricao_oficial_sucesso`.
9. `inscricao_checkout`.

Use funil fechado para novos preenchimentos e uma exploracao aberta separada
para retomadas (que podem iniciar na etapa 3 ou 5). Mostre tempo decorrido e
compare por categoria do dispositivo e origem/midia da sessao. Use usuarios
para taxas de passagem; contagem de eventos inclui repeticoes de etapas.
O abandono e inferido pela falta da etapa seguinte no periodo, sem depender de
um evento de fechamento de aba. Checkout de pedidos antigos e retorno privado
nao formam necessariamente o mesmo funil de uma nova inscricao.

Crie exploracoes livres para `inscricao_erro` por etapa/tipo, `inscricao_cupom`
por resultado e pedidos salvos por camiseta/modalidade/chopp/com_cupom.
Isso ajuda a identificar dificuldades no celular, tamanhos mais escolhidos,
eficacia dos cupons e pontos de desistencia.

## 6. Validacao antes de publicar

1. Use o DebugView com debug ativado e percorra a inscricao num ambiente de teste.
2. Verifique um page_view por entrada em `/inscricao`, os numeros das etapas e
   erros de validacao. Voltar a uma etapa deve registrar outra visualizacao.
3. Teste cupom valido/invalido; confirme que o codigo nao aparece nos parametros.
4. Confirme que erro da API nao gera conversao. Use API simulada/ambiente de teste
   para pedido salvo; nao crie pedidos reais so para validar Analytics.
5. Confira que nao aparecem nome, telefone, CPF, email, nascimento, observacoes
   medicas, ID/chave do pedido, URLs privadas ou mensagens de erro.
6. Desative debug, gere o build e publique com as configuracoes do fluxo prontas.
7. Verifique recebimento no GA4. Bloqueadores de anuncio/rede e configuracoes do
   visitante podem impedir coleta; o GA nao e fonte contabil de inscricoes.

Validacao local automatizada: `npm run test:analytics`,
`node scripts/test-registration-browser.mjs`,
`node scripts/test-payment-browser.mjs` e `npm run build`.
Os testes validam chamadas da tag com rede externa bloqueada, nao o recebimento
efetivo na propriedade Google.

Referencias oficiais:
- [Pageviews manuais e historico](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Medicao otimizada](https://support.google.com/analytics/answer/9216061)
- [Dimensoes e metricas personalizadas](https://support.google.com/analytics/answer/14240153)
- [Funis](https://support.google.com/analytics/answer/9327974)
- [Eventos principais](https://support.google.com/analytics/answer/13128484)
