// First-move-advantage via color-swapped varied openings.
// Position bias cancels across each mirrored pair; residual = tempo (first-move) effect.
const { chromium } = require('playwright');
(async () => {
  const shielded = (process.argv[2]||'1')==='1';
  const pairs = parseInt(process.argv[3]||'4',10);
  const K = parseInt(process.argv[4]||'10',10);
  const tier = parseInt(process.argv[5]||'1200',10);
  const cap = parseInt(process.argv[6]||'140',10);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
  const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/'+(process.env.SF||'three-floor-chess.html')+''); await p.waitForTimeout(300);
  const res = await p.evaluate(async ({shielded,pairs,K,tier,cap})=>{
    const G=window.__game; G.setGameType('open');
    const rnd=(n)=>Math.floor(Math.random()*n);
    function stateFrom(pieces,turn){ const st=G.newState(); let id=1;
      for(const q of pieces) st.pieces.push({id:id++,type:q.type,color:q.color,floor:q.floor,r:q.r,c:q.c,fwd:!!q.fwd,moved:!!q.moved});
      st.turn=turn||'w'; st.generalsAlive={w:3,b:3}; st.reserveKing={w:true,b:true}; st.kingOut={w:false,b:false}; return st; }
    function symOpening(){
      // symmetric army: white via builder (or fixed preset), black = mirror of the SAME army
      const w = shielded? G.presetFor('w') : G.presetArmy('w');
      const pieces=[];
      for(const q of w) pieces.push({type:q.type,color:'w',floor:q.floor,r:q.r,c:q.c,fwd:!!q.fwd});
      for(const q of w) pieces.push({type:q.type,color:'b',floor:q.floor,r:7-q.r,c:q.c,fwd:!!q.fwd});
      return stateFrom(pieces,'w');
    }
    function randTurn(S,color){ let guard=0;
      while(S.floorsActed.some(x=>!x)&&guard<5){ guard++;
        const acts=G.legalActions(S,color,G.ctxOf(S)); if(!acts.length) break;
        const safe=acts.filter(a=>{ if(!a.cap) return true; const v=S.pieces.find(x=>x.id===a.cap); return !(v&&v.type==='G'); });
        const pool=safe.length?safe:acts; const a=pool[rnd(pool.length)];
        G.doAction(S,a,color,null); if(S.over||S.mustPlace) return false;
        if(Math.random()<0.35) break; }
      return true; }
    function makeOpening(K){ const S=symOpening(); G.S=S;
      for(let i=0;i<K;i++){ const col=S.turn; if(!randTurn(S,col)) return null; if(S.over) return null; G.endTurn(S); if(S.over||S.mustPlace||S.kingOut.w||S.kingOut.b) return null; }
      return S.pieces.map(q=>({type:q.type,color:q.color,floor:q.floor,r:q.r,c:q.c,fwd:!!q.fwd})); }
    function playout(S){ G.S=S; let i=0;
      for(;i<cap && !S.over;i++){ const col=S.turn; G.aiPlayTurn(S,col,tier,null);
        if(S.mustPlace){ const c=S.mustPlace; outer:for(let f=0;f<3;f++)for(let r=0;r<8;r++)for(let cc=0;cc<8;cc++){const h=(c==='w')?r<=3:r>=4; if(h&&!G.at(S,f,r,cc)){G.addPiece('K',c,f,r,cc);S.kingOut[c]=true;break outer;}} S.mustPlace=null; }
        G.endTurn(S); }
      return {res:S.over?(S.over.winner||'draw'):'unfinished', reason:S.over?S.over.reason:'cap', plies:i}; }
    function mirrorPieces(pieces){ return pieces.map(q=>({type:q.type,color:q.color==='w'?'b':'w',floor:q.floor,r:7-q.r,c:q.c,fwd:!!q.fwd})); }

    let firstWins=0,secondWins=0,draws=0,skipped=0,decisivePlies=0,tries=0;
    while(tries<pairs){
      const open=makeOpening(K);
      if(!open){ skipped++; if(skipped>pairs*6) break; continue; }
      tries++;
      const s1=stateFrom(open,'w'); const r1=playout(s1);
      const s2=stateFrom(mirrorPieces(open),'w'); const r2=playout(s2);
      for(const r of [r1,r2]){
        if(r.res==='w') { firstWins++; decisivePlies+=r.plies; }
        else if(r.res==='b'){ secondWins++; decisivePlies+=r.plies; }
        else draws++;
      }
    }
    return {shielded,pairs:tries,K,tier,cap,firstWins,secondWins,draws,skipped,
      avgDecisivePlies: (firstWins+secondWins)? +(decisivePlies/(firstWins+secondWins)).toFixed(0):0};
  }, {shielded,pairs,K,tier,cap});
  res.errs=errs.length;
  console.log('RESULT '+JSON.stringify(res));
  await b.close();
})();
