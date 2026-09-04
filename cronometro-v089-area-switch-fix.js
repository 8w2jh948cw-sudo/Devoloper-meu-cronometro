'use strict';
/* v0.8.9 — correção da troca de área com registro pendente.
   A área é escolhida dentro do popover lateral. O fluxo antigo abria o modal
   pendingModelSwitch sem fechar esse popover, deixando o modal atrás do menu. */
(function(){
  if(typeof activateArea!=='function')return;
  const activateAreaBeforeV089=activateArea;
  activateArea=async function(id){
    /* O popover precisa sair da árvore visual antes de qualquer modal/confirm. */
    if(typeof ui!=='undefined'&&ui)ui.popover=null;
    return activateAreaBeforeV089(id);
  };
})();
