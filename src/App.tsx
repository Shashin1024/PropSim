import {useState} from 'react';import {Firm,Trader,Result,run} from './engine';
const F0:Firm={size:50000,price:150,resetFee:100,target:3000,maxDD:2000,trailing:false,dailyOn:false,dailyLoss:1000,consOn:true,consPct:50,minDaysOn:false,minDays:5,maxDaysOn:false,maxDays:30,payout:1500};
const T0:Trader={winRate:57.14,rr:0.75,riskPct:100,tpd:1,n:10,sims:5000};
const money=(x:number)=>isFinite(x)?'$'+Math.round(x).toLocaleString():'∞';
function Num<T extends object>({l,o,k,set,step=1}:{l:string;o:T;k:keyof T;set:(v:T)=>void;step?:number}){
 return <label className="f"><span>{l}</span><input type="number" step={step} value={o[k] as number} onChange={e=>set({...o,[k]:+e.target.value})}/></label>}
function Tog({l,o,on,k,set,step=1}:{l:string;o:Firm;on:keyof Firm;k:keyof Firm;set:(v:Firm)=>void;step?:number}){
 return <div className="f tog"><label><input type="checkbox" checked={o[on] as boolean} onChange={e=>set({...o,[on]:e.target.checked})}/>{l}</label>
 <input type="number" step={step} disabled={!o[on]} value={o[k] as number} onChange={e=>set({...o,[k]:+e.target.value})}/></div>}
function Fan({r,f}:{r:Result;f:Firm}){const W=640,H=280,P=36,all=r.bands.flat().concat([f.target,-f.maxDD]),lo=Math.min(...all),hi=Math.max(...all);
 const x=(d:number)=>P+d/r.D*(W-P-8),y=(v:number)=>H-P-(v-lo)/(hi-lo||1)*(H-P-10);
 const poly=(a:number[],b:number[])=>a.map((v,d)=>`${x(d)},${y(v)}`).concat(b.map((v,d)=>`${x(d)},${y(v)}`).reverse()).join(' ');
 const line=(a:number[])=>a.map((v,d)=>`${x(d)},${y(v)}`).join(' ');
 return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Equity curve percentile bands">
 <polygon points={poly(r.bands[0],r.bands[4])} fill="#0f766e22"/><polygon points={poly(r.bands[1],r.bands[3])} fill="#0f766e44"/>
 <polyline points={line(r.bands[2])} fill="none" stroke="#0f766e" strokeWidth="2"/>
 <line x1={P} x2={W-8} y1={y(f.target)} y2={y(f.target)} stroke="#0f766e" strokeDasharray="4 4"/><text x={P+4} y={y(f.target)-4} className="t">target {money(f.target)}</text>
 <line x1={P} x2={W-8} y1={y(-f.maxDD)} y2={y(-f.maxDD)} stroke="#b4412f" strokeDasharray="4 4"/><text x={P+4} y={y(-f.maxDD)-4} className="t">max drawdown</text>
 <line x1={P} x2={W-8} y1={y(0)} y2={y(0)} stroke="#8895a3"/><text x={P} y={H-8} className="t">day 0</text><text x={W-40} y={H-8} className="t">day {r.D}</text></svg>}
function Dist({pmf,size}:{pmf:number[];size:number}){const m=Math.max(...pmf),W=640,H=140,bw=(W-20)/pmf.length;
 return <svg viewBox={`0 0 ${W} ${H+22}`} role="img" aria-label="Distribution of funded account count">{pmf.map((v,k)=>
 <g key={k}><rect x={10+k*bw+1} y={H-v/m*H} width={bw-2} height={v/m*H} fill="#14202b"><title>{k} funded ({money(k*size)}): {(v*100).toFixed(1)}%</title></rect>
 {pmf.length<=26&&<text x={10+k*bw+bw/2} y={H+14} className="t" textAnchor="middle">{k}</text>}</g>)}</svg>}
export default function App(){
 const [f,setF]=useState(F0),[t,setT]=useState(T0),[r,setR]=useState<Result>(()=>run(F0,T0));
 const fails=r.why.dd+r.why.daily+r.why.time,pc=(v:number)=>(fails?v/(fails)*100:0).toFixed(0)+'%';
 return <main><header><h1>Prop firm evaluation simulator</h1><p>Each account trades independently. Results are Monte Carlo estimates over {t.sims.toLocaleString()} evaluations.</p></header>
 <div className="grid"><aside>
  <h2>Account rules</h2>
  <Num l="Account size ($)" o={f} k="size" set={setF}/><Num l="Price ($)" o={f} k="price" set={setF}/><Num l="Reset fee ($, 0 = rebuy)" o={f} k="resetFee" set={setF}/>
  <Num l="Profit target ($)" o={f} k="target" set={setF}/><Num l="Max drawdown ($)" o={f} k="maxDD" set={setF}/>
  <label className="f tog"><label><input type="checkbox" checked={f.trailing} onChange={e=>setF({...f,trailing:e.target.checked})}/>Trailing drawdown (locks at start balance)</label></label>
  <Tog l="Daily loss limit ($)" o={f} on="dailyOn" k="dailyLoss" set={setF}/><Tog l="Consistency: best day ≤ % of profit" o={f} on="consOn" k="consPct" set={setF}/>
  <Tog l="Minimum trading days" o={f} on="minDaysOn" k="minDays" set={setF}/><Tog l="Maximum days" o={f} on="maxDaysOn" k="maxDays" set={setF}/>
  <Num l="Expected payout per funded account ($)" o={f} k="payout" set={setF}/>
  <h2>Trader</h2>
  <Num l="Win rate (%)" o={t} k="winRate" set={setT} step={0.01}/><Num l="Reward : risk" o={t} k="rr" set={setT} step={0.05}/>
  <Num l="Risk per trade (% of max drawdown)" o={t} k="riskPct" set={setT}/><Num l="Trades per day" o={t} k="tpd" set={setT}/>
  <Num l="Accounts to buy (n)" o={t} k="n" set={setT}/><Num l="Simulations" o={t} k="sims" set={setT}/>
  <button onClick={()=>setR(run(f,t,Date.now()))}>Run simulation</button></aside>
 <section>
  <div className="stats">
   <div><b>{(r.p*100).toFixed(1)}%</b>pass rate</div><div><b>{r.expFunded.toFixed(1)}</b>funded of {t.n}</div>
   <div><b>{money(r.expCapital)}</b>expected funded capital</div><div><b>{money(r.costToFund)}</b>cost per funded account</div>
   <div><b className={r.ev>=0?'pos':'neg'}>{money(r.ev)}</b>EV per account</div><div><b>{r.worth.toFixed(0)}/100</b>worth score</div>
   <div><b>{isNaN(r.medTrades)?'–':r.medTrades}</b>median trades to pass ({isNaN(r.medDays)?'–':r.medDays} days)</div>
   <div><b>{r.aggression.toFixed(0)}/100</b>aggression ({r.lossesToBust.toFixed(1)} losses to bust)</div>
   <div><b>{r.ddPerDollar.toFixed(1)}×</b>drawdown per $ paid</div><div><b>{(r.pAny*100).toFixed(1)}%</b>chance at least one passes</div></div>
  <h2>Equity curves: median, 25–75% and 5–95% bands</h2><Fan r={r} f={f}/>
  <h2>Funded accounts out of {t.n} (hover for capital)</h2><Dist pmf={r.pmf} size={f.size}/>
  <h2>Why evaluations fail</h2><p>Drawdown breach {pc(r.why.dd)}, daily loss {pc(r.why.daily)}, ran out of days {pc(r.why.time)}.</p>
  <p className="note">Worth score = 40% drawdown per dollar paid (10× = full marks), 30% pass rate, 30% expected return on price. Aggression = how few losses at your risk size reach the drawdown limit.</p>
 </section></div></main>}
