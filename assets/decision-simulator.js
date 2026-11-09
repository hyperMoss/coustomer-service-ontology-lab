// Teaching simulator faithfully represents the branching structure in
// OntoCare/app.py allowed_actions() at the referenced revision.
// This only computes allowed/forbidden *candidate* actions; it never calls an API.
(function(){
  const root=document.getElementById('decision-lab');
  if(!root)return;
  const out=document.getElementById('decision-result');
  const names={
    ask_product:'询问客户确认产品',
    search_knowledge:'搜索知识资料',
    run_troubleshooting:'继续排障工作流',
    escalate_human:'提供人工核查路径',
    ask_country:'询问购买国家',
    ask_seller:'询问经销商',
    request_proof:'索取购买凭证',
    tell_expired:'断言已经过保',
    propose_replacement:'直接建议换货',
    direct_refund:'直接退款',
    propose_paid_repair:'建议有偿维修路径',
    prepare_replacement_review:'准备换货人工审核材料',
    guide_contact_seller:'引导联系原购买渠道',
    prepare_return_review:'准备退货人工审核材料'
  };
  function model(s){
    let allowed=[],forbidden=[],reasons=[],branch='';
    if(s.product==='UNKNOWN'){
      allowed=['ask_product','search_knowledge'];
      forbidden=['propose_replacement','direct_refund'];
      reasons=['产品未确认，不能办理售后动作'];branch='no_product';
    }else{
      allowed=['search_knowledge','run_troubleshooting','escalate_human'];
      if(s.warranty==='UNKNOWN'||s.warranty==='PENDING_RECHECK'){
        forbidden=['propose_replacement','direct_refund','tell_expired'];
        allowed.push('ask_country','ask_seller','request_proof');
        reasons.push('UNKNOWN 不等于 EXPIRED，必须补齐来源');branch='warranty_unknown';
      }else if(s.warranty==='EXPIRED'){
        forbidden=['propose_replacement','direct_refund'];
        allowed.push('propose_paid_repair');
        reasons.push('已过保：进入有偿维修建议分支');branch='warranty_expired';
      }else{
        if(s.troubleshooting==='FAILED' && s.dealer==='AUTHORIZED'){
          allowed.push('prepare_replacement_review');
          reasons.push('在保 + 授权渠道 + FAILED：只准备人工审核材料');
        }
        if(s.dealer==='NOT_AUTHORIZED'){
          forbidden.push('propose_replacement','direct_refund');
          allowed.push('guide_contact_seller');
          reasons.push('非授权经销商：先联系购买渠道');
        }else if(s.within30 && s.dealer==='AUTHORIZED'){
          allowed.push('prepare_return_review');
          reasons.push('演示订单 30 天内：仅可准备退货审核');
        }
        forbidden.push('direct_refund','propose_replacement');
        reasons.push('演示环境没有真实退款/换货执行器');
        branch='warranty_valid';
      }
    }
    return {allowed:[...new Set(allowed)],forbidden:[...new Set(forbidden)],reasons,branch};
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const render=()=>{
    const s={
      product:root.querySelector('[name=product]').value,
      warranty:root.querySelector('[name=warranty]').value,
      dealer:root.querySelector('[name=dealer]').value,
      troubleshooting:root.querySelector('[name=troubleshooting]').value,
      within30:root.querySelector('[name=within30]').checked
    };
    const r=model(s);
    const pills=(a,klass='')=>a.map(v=>`<span class="chip ${klass}">${esc(names[v]||v)}</span>`).join(' ');
    out.innerHTML=`<div class="sim-kicker">匹配分支：${esc(r.branch)}</div><p><strong>允许的候选动作</strong><br>${pills(r.allowed)}</p><p><strong>明确禁止</strong><br>${pills(r.forbidden,'block')}</p><p><strong>判断理由</strong></p><ul>${r.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="subline">这里是业务动作决策模拟，不会执行退款或创建工单。</p>`;
    out.setAttribute('aria-live','polite');
  };
  root.querySelectorAll('select,input').forEach(x=>x.addEventListener('change',render));render();
})();
