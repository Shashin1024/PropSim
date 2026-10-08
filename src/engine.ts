export type Firm={size:number;price:number;resetFee:number;target:number;maxDD:number;trailing:boolean;
 dailyOn:boolean;dailyLoss:number;consOn:boolean;consPct:number;minDaysOn:boolean;minDays:number;maxDaysOn:boolean;maxDays:number;payout:number};
export type Trader={winRate:number;rr:number;riskPct:number;tpd:number;n:number;sims:number};
export type Result={p:number;medTrades:number;medDays:number;why:{dd:number;daily:number;time:number};D:number;
 bands:number[][];pmf:number[];expFunded:number;pAny:number;expCapital:number;costToFund:number;ev:number;
 worth:number;lossesToBust:number;aggression:number;ddPerDollar:number};
const rng=(seed:number)=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let x=s;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}};
const med=(a:number[])=>a.length?[...a].sort((x,y)=>x-y)[a.length>>1]:NaN;
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));
export function run(f:Firm,t:Trader,seed=1):Result{
 const r=rng(seed),D=f.maxDaysOn?f.maxDays:60,risk=f.maxDD*t.riskPct/100,win=risk*t.rr,pw=t.winRate/100;
 const paths:Float32Array[]=[],tt:number[]=[],dd:number[]=[],why={dd:0,daily:0,time:0};let pass=0;
 for(let i=0;i<t.sims;i++){
  const path=new Float32Array(D+1);let eq=0,peak=0,best=0,trades=0,out:''|'pass'|'dd'|'daily'='',d=1;
  for(;d<=D&&!out;d++){let day=0;
   for(let k=0;k<t.tpd;k++){const x=r()<pw?win:-risk;eq+=x;day+=x;trades++;peak=Math.max(peak,eq);
    const floor=f.trailing?Math.min(0,peak-f.maxDD):-f.maxDD;
    if(eq<=floor){out='dd';break}
    if(f.dailyOn&&day<=-f.dailyLoss){out='daily';break}}
   path[d]=eq;best=Math.max(best,day);
   if(!out&&eq>=f.target&&(!f.minDaysOn||d>=f.minDays)&&(!f.consOn||best<=f.consPct/100*eq))out='pass'}
  const last=Math.min(d-1,D);for(let j=last+1;j<=D;j++)path[j]=path[last];
  if(out==='pass'){pass++;tt.push(trades);dd.push(last)}else if(out==='dd')why.dd++;else if(out==='daily')why.daily++;else why.time++;
  paths.push(path)}
 const bands=[.05,.25,.5,.75,.95].map(()=>new Array(D+1).fill(0));
 for(let d=0;d<=D;d++){const col=paths.map(p=>p[d]).sort((a,b)=>a-b);[.05,.25,.5,.75,.95].forEach((q,i)=>bands[i][d]=col[Math.floor(q*(col.length-1))])}
 const p=pass/t.sims,pc=clamp(p,1e-9,1-1e-9),n=t.n,pmf=[Math.pow(1-pc,n)];
 for(let k=1;k<=n;k++)pmf.push(pmf[k-1]*(n-k+1)/k*pc/(1-pc));
 const retry=f.resetFee>0?f.resetFee:f.price,costToFund=p>0?f.price+(1/p-1)*retry:Infinity;
 const ev=p*f.payout-f.price,ddPerDollar=f.maxDD/f.price,lossesToBust=f.maxDD/risk;
 const worth=100*(.4*clamp(ddPerDollar/10)+.3*p+.3*clamp((ev/f.price+1)/4));
 return{p,medTrades:med(tt),medDays:med(dd),why,D,bands,pmf,expFunded:n*p,pAny:1-pmf[0],expCapital:n*p*f.size,costToFund,ev,worth,lossesToBust,
  aggression:100*(1-clamp((lossesToBust-1)/9)),ddPerDollar}}
