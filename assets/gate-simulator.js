/* Lesson 03 simulator: transparent approximation of the gate checks in
 * orchestrator/app/actions/gate.py. No network calls or real actions. */
(function(){
  'use strict';
  const root = document.getElementById('gate-lab');
  if(!root) return;
  const result = document.getElementById('gate-result');
  const fields = name => root.querySelector('[name="' + name + '"]');
  const val = name => fields(name).value;
  const checked = name => fields(name).checked;
  const required = {
    replace: ['order_or_receipt','address','photo_or_video','serial_number'],
    refund: ['order_or_receipt','address','photo_or_video','serial_number'],
    reship: ['order_or_receipt'],
    carrier_investigation: ['order_or_receipt']
  };
  const labels = {
    order_or_receipt:'订单或购买凭证',address:'收货地址',
    photo_or_video:'故障照片或视频',serial_number:'产品 SN'
  };
  function run(){
    const kind = val('kind');
    const missing = required[kind].filter(name => !checked(name));
    const warranty = val('warranty');
    const eligible = kind === 'replace' || kind === 'refund' ? warranty === 'in_warranty' : checked('logistics_ok');
    const evidence = missing.length === 0 && checked('user_confirmed');
    const safety = checked('allowed_operations') && !checked('reported_risk');
    const idem = !['running','succeeded'].includes(val('execution_status')) && ['awaiting_confirmation','approved','executing_failed'].includes(val('case_status'));
    const needsIndependentReview = (kind === 'replace' || kind === 'refund');
    const review = !needsIndependentReview || checked('review_pass');
    const arr = [
      {name:'eligibility',title:'办理资格',pass:eligible,reason:eligible?'业务条件满足':(kind==='replace'||kind==='refund'?'质保状态不是已确认在保':'物流条件不符合')},
      {name:'evidence',title:'必要证据',pass:evidence,reason:evidence?'材料齐全且客户确认':missing.length?'缺少：'+missing.map(k=>labels[k]).join('、'):'客户尚未确认提交'},
      {name:'safety',title:'安全限制',pass:safety,reason:safety?'无当前阻止提交的安全限制':'存在未解除风险或操作被禁止'},
      {name:'idempotency',title:'重复执行控制',pass:idem,reason:idem?'案件状态与执行状态允许本次尝试':'案件状态不允许，或相同动作已在执行／成功'},
      {name:'review',title:'独立审查',pass:review,reason:!needsIndependentReview?'物流类：此动作不需要模型独立审查':(review?'审核一致（模拟）':'未通过独立审查（模拟）')}
    ];
    const all = arr.every(x=>x.pass);
    const status = document.createElement('div');
    status.className = 'gate-summary ' + (all?'pass':'fail');
    const strong = document.createElement('strong');
    strong.textContent = all?'可以提交服务单（仅模拟门控结果）':'拒绝本次提交，回退人工核查';
    const small = document.createElement('span');
    small.textContent = arr.filter(x=>x.pass).length + ' / 5 项通过 · 只模拟条件，不接入任何业务服务';
    status.append(strong,small);
    const list = document.createElement('div');
    list.className = 'gate-list';
    arr.forEach(x=>{
      const row=document.createElement('div');row.className='gate-check '+(x.pass?'pass':'fail');
      const icon=document.createElement('span');icon.className='gate-icon';icon.textContent=x.pass?'✓':'×';
      const desc=document.createElement('div');
      const title=document.createElement('strong');title.textContent=x.name+' · '+x.title;
      const explanation=document.createElement('small');explanation.textContent=x.reason;
      desc.append(title,explanation);row.append(icon,desc);list.append(row);
    });
    result.replaceChildren(status,list);
  }
  function setPreset(preset){
    const defaults = {
      kind:'replace',warranty:'in_warranty',logistics_ok:false,
      order_or_receipt:true,address:true,photo_or_video:true,serial_number:true,
      user_confirmed:true,allowed_operations:true,reported_risk:false,
      case_status:'approved',execution_status:'none',review_pass:true
    };
    const presets = {
      ok:{},
      switch:{kind:'replace',review_pass:false},
      timeout:{execution_status:'running'},
      missing:{photo_or_video:false,serial_number:false}
    };
    const data=Object.assign({},defaults,presets[preset]||{});
    Object.keys(data).forEach(k=>{
      const f=fields(k);if(!f)return;
      if(f.type==='checkbox')f.checked=Boolean(data[k]);else f.value=data[k];
    });
    document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('selected',b.dataset.preset===preset));
    run();
  }
  root.addEventListener('input',run);
  root.addEventListener('change',run);
  root.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>setPreset(btn.dataset.preset)));
  setPreset('missing');
})();
