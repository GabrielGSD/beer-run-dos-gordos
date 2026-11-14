# Limite visual de inscrições

O frontend limita novas inscrições a **100 atletas confirmados no total**,
somando Adulto e Kids, por causa do estoque de medalhas. O limite fica em
`TOTAL_REGISTRATION_CAPACITY`, em `src/composables/useRegistrationAvailability.js`.

A fonte é a lista de confirmados de `GET /api/athletes`: `summary.total`,
validado contra o tamanho de `athletes`. Pré-inscritos e lista de espera não
entram na contagem. `summary.capacity` não define esse limite compartilhado.

A lista e os botões compartilham uma única consulta, atualizada a cada 30 segundos
com a página visível, ao voltar à janela e antes de enviar uma nova inscrição.
Ao atingir ou ultrapassar 100, Adulto e Kids ficam bloqueados, inclusive por link
direto. Falhas de consulta impedem novas inscrições até tentar novamente.
Consulta, pagamento e recuperação de tentativas anteriores continuam disponíveis.

Na home, o hero mostra quantas vagas restam em um carimbo inclinado sobreposto ao
canto superior direito do botão, com a indicação "Adulto + Kids". Com dez ou menos vagas, mostra "Últimas N vagas";
com uma, "Última vaga". O total de confirmados permanece no rótulo acessível. Ao esgotar,
remove o contador e mantém o botão "Vagas esgotadas" desabilitado.

Para publicar esta regra basta atualizar o frontend. Não depende de
`/api/registrations/availability`, de migration ou de mudança no env do servidor.
As regras existentes do backend continuam valendo. Este bloqueio visual não
reserva medalhas nem impede pagamentos já abertos, chamadas diretas à API ou
inscrições simultâneas de ultrapassarem 100; uma garantia rígida exigiria controle
compartilhado no backend.
