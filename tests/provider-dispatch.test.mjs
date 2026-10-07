import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, overrides = {}, env = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url),'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, URL, console, process: { env },
    require: name => overrides[name] || require(name) });
  return module.exports;
}
const activeEnv = { MARKETPLACE_WHATSAPP_DELIVERY_MODE:'automatic', MARKETPLACE_WHATSAPP_AUTO_SEND:'true',
  MARKETPLACE_PROVIDER_AUTOMATION_START_AT:'2026-10-07T06:24:31Z',
  META_WHATSAPP_TEMPLATE_NAME:'provider-test', META_WHATSAPP_TEMPLATE_LANGUAGE:'en' };

test('auto-send requires both switches and a valid activation date; historic requests stay manual', () => {
  const module = load('../services/marketplace/dispatchSafeguards.ts', { '../supabaseAdmin': {} }, activeEnv);
  assert.equal(module.providerAutoSendApplies('2026-10-06T00:00:00Z'),false);
  assert.equal(module.providerAutoSendApplies('2026-10-07T06:25:00Z'),true);
  for (const env of [{...activeEnv,MARKETPLACE_WHATSAPP_AUTO_SEND:'false'},
    {...activeEnv,MARKETPLACE_PROVIDER_AUTOMATION_START_AT:''}, {...activeEnv,MARKETPLACE_WHATSAPP_DELIVERY_MODE:'manual'}]) {
    assert.equal(load('../services/marketplace/dispatchSafeguards.ts', {'../supabaseAdmin':{}},env)
      .providerAutoSendApplies('2026-10-07T06:25:00Z'),false);
  }
});

test('project lease blocks overlapping work and is released even after operation failure', async () => {
  const owners=new Map(); let releaseGate;
  const gate=new Promise(resolve=>{releaseGate=resolve;});
  const module=load('../services/marketplace/dispatchSafeguards.ts', {'../supabaseAdmin':{getSupabaseAdmin:()=>({
    rpc: async (name,args)=>{
      if (name.startsWith('acquire')) {
        if (owners.has(args.p_key)) return {data:false};
        owners.set(args.p_key,args.p_owner);return {data:true};
      }
      if(owners.get(args.p_key)===args.p_owner)owners.delete(args.p_key);
      return {error:null};
    },
  })}});
  const first=module.withMarketplaceLease('routing:test',()=>gate);
  await assert.rejects(module.withMarketplaceLease('routing:test',async()=>{}),module.MarketplaceBusyError);
  releaseGate();await first;assert.equal(owners.size,0);
  await assert.rejects(module.withMarketplaceLease('routing:test',async()=>{throw Error('Worker stopped');}),/Worker stopped/);
  assert.equal(owners.size,0);
});

test('unavailable lease storage fails closed before dispatch',async()=>{
  let called=false;
  const module=load('../services/marketplace/dispatchSafeguards.ts',{'../supabaseAdmin':{
    getSupabaseAdmin:()=>({rpc:async()=>({error:Error('DB unavailable')})}),
  }});
  await assert.rejects(module.withMarketplaceLease('routing:test',async()=>{called=true;}),/protection is unavailable/);
  assert.equal(called,false);
});

test('provider send budgets enforce global hourly/daily and per-provider caps without exposing recipient data',async()=>{
  const calls=[];
  const module=load('../services/marketplace/dispatchSafeguards.ts',{'../supabaseAdmin':{getSupabaseAdmin:()=>({
    rpc:async(_,args)=>{if(!args)return {data:true};calls.push(args);return {data:args.p_bucket!=='provider_recipient_day'};},
  })}},activeEnv);
  assert.equal(await module.reserveProviderSendBudget(123),false);
  assert.deepEqual(calls.map(x=>[x.p_limit,x.p_window_seconds]),[[20,3600],[60,86400],[3,86400]]);
  assert.ok(calls.every(x=>/^[a-f0-9]{64}$/.test(x.p_key_hash)));
});

test('runtime kill switch blocks sends before spending any quota',async()=>{
  let quotaCalls=0;
  const module=load('../services/marketplace/dispatchSafeguards.ts',{'../supabaseAdmin':{getSupabaseAdmin:()=>({
    rpc:async(_,args)=>{if(args)quotaCalls++;return {data:false};},
  })}},activeEnv);
  assert.equal(await module.reserveProviderSendBudget(123),false);assert.equal(quotaCalls,0);
});

function fixture({budget=true,duringSend=null,fail=false}={}) {
  const row={id:'invitation',status:'queued',sent_at:null,delivery_attempted_at:null};
  let sends=0;const attempts=[];
  const db={from:table=>{
    let values;const conditions=[];
    const exec=()=>{
      if(table==='lead_invitation_delivery_attempts')return {error:null};
      if(!conditions.every(([key,expected])=>row[key]===expected))return {data:null,error:null};
      Object.assign(row,values);return {data:{id:row.id},error:null};
    };
    const query={ update:data=>{values=data;return query;}, insert:data=>{attempts.push(data);return query;},
      eq:(key,value)=>{conditions.push([key,value]);return query;},is:(key,value)=>{conditions.push([key,value]);return query;},
      select:()=>query,maybeSingle:async()=>exec(),then:(yes,no)=>Promise.resolve(exec()).then(yes,no) };
    return query;
  }};
  const safeguards=load('../services/marketplace/dispatchSafeguards.ts',{'../supabaseAdmin':{}},activeEnv);
  const module=load('../services/marketplace/whatsappDelivery.ts',{
    '../supabaseAdmin':{getSupabaseAdmin:()=>db},
    './dispatchSafeguards':{...safeguards,reserveProviderSendBudget:async()=>budget},
    './whatsappPolicy.js':{normaliseWhatsAppRecipient:x=>x,isPlausibleWhatsAppRecipient:()=>true},
    './metaWhatsApp':{getMetaWhatsAppConfiguration:()=>({}),publicMarketplaceUrl:()=>'https://site.example',bodyComponent:x=>x,
      sendMetaWhatsAppTemplate:async()=>{sends++;if(duringSend)row.status=duringSend;if(fail)throw Error('Delivery timeout');
        return {status:'sent',externalMessageId:'mock-message'};}},
  },activeEnv);
  const input={project:{id:'project',createdAt:'2026-10-07T06:25:00Z',title:'Test',category:'Plumbing',location:'Benoni'},
    invitations:[{invitationId:'invitation',providerId:123,responseToken:'mock-token',
      responseDeadline:'2026-10-07T08:25:00Z',deliveryAddress:'mock-recipient',providerName:'Test provider'}]};
  return {module,input,row,attempts,sends:()=>sends};
}

test('concurrent dispatch sends once; the atomic claim prevents repeat delivery',async()=>{
  const f=fixture();await Promise.all([f.module.dispatchProviderInvitations(f.input),f.module.dispatchProviderInvitations(f.input)]);
  assert.equal(f.sends(),1);assert.equal(f.row.status,'sent');assert.ok(f.row.delivery_attempted_at);
});
test('provider replies arriving during send are preserved',async()=>{
  for(const status of ['accepted','declined','viewed','delivered']){
    const f=fixture({duringSend:status});await f.module.dispatchProviderInvitations(f.input);
    assert.equal(f.row.status,status);assert.equal(f.row.external_message_id,'mock-message');
  }
});
test('send cap failure does not contact Meta and is recorded for review',async()=>{
  const f=fixture({budget:false});await f.module.dispatchProviderInvitations(f.input);
  assert.equal(f.sends(),0);assert.equal(f.row.status,'failed');assert.equal(f.attempts[0].error_code,'send_limit');
});
test('uncertain delivery failure is not automatically retried',async()=>{
  const f=fixture({fail:true});await f.module.dispatchProviderInvitations(f.input);
  await f.module.dispatchProviderInvitations(f.input);assert.equal(f.sends(),1);assert.equal(f.row.status,'failed');
});
test('historic project dispatch performs no send',async()=>{
  const f=fixture();f.input.project.createdAt='2026-10-06T00:00:00Z';
  await f.module.dispatchProviderInvitations(f.input);assert.equal(f.sends(),0);assert.equal(f.row.delivery_attempted_at,null);
});

test('candidate discovery excludes rejected, inactive, unavailable and wrong-work providers',async()=>{
  const base={id:1,name:'Named provider',category:'Plumber',location:'Benoni',phone:'valid',status:'active',approval_status:'pending'};
  const providers=[base,{...base,id:2,approval_status:'rejected'},{...base,id:3,status:'inactive'},
    {...base,id:4},{...base,id:5},{...base,id:6,phone:'invalid'}];
  const data={projects:{id:'project',category:'Plumbing',title:'Sink repair',location_text:'Benoni',urgency:'planned',status:'matching'},
    project_matches:null,artisans:providers,lead_invitations:[],provider_availability:[
      {provider_id:4,availability_status:'unavailable'},{provider_id:5,availability_status:'available_today',accepts_planned_work:false},
    ]};
  const module=load('../services/marketplace/providerCandidates.ts',{
    '../supabaseAdmin':{getSupabaseAdmin:()=>({from:table=>{
      const result={data:data[table],error:null};const q={};
      for(const method of ['select','eq','in','order','limit','gte'])q[method]=()=>q;
      q.single=q.maybeSingle=async()=>result;q.then=(yes,no)=>Promise.resolve(result).then(yes,no);return q;
    }})},
    './whatsappPolicy.js':{normaliseWhatsAppRecipient:x=>x,isPlausibleWhatsAppRecipient:x=>x==='valid'},
  });
  const result=await module.getProviderCandidates('project');assert.deepEqual(Array.from(result.candidates,x=>x.providerId),[1]);
  assert.equal(result.candidates[0].displayName,'Named provider');
});
