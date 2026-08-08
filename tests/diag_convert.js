const { chromium } = require('playwright');
(async () => {
  const tier=parseInt(process.argv[2]||'1200',10), games=parseInt(process.argv[3]||'8',10), cap=parseInt(process.argv[4]||'240',10);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/scratch_study.html'); await p.waitForTimeout(300);
  const out = await p.evaluate(async ({tier,games,cap})=>{
    const G=window.__game; G.setGameType('open');
    const V={P:1,N:3,B:3,R:5,Q:9,K:0,G:0};
    const mat=(S,c)=>S.pieces.filter(x=>x.color===c).reduce((s,x)=>s+V[x.type],0);
    let draws=0,wWin=0,bWin=0,mate=0,elim=0,kingOutW=0,kingOutB=0,plies=0,capsTot=0,genCapsTot=0;
    for(let g=0;g<games;g++){
      const S=G.newState(); G.S=S;
      for(const q of G.presetArmy('w')) S.pieces.push(q);
      for(const q of G.presetArmy('b')) S.pieces.push(q);
      S.turn='w'; G.goPlay();
      let i=0, capsBefore=0;
      for(;i<cap && !S.over;i++){ const col=S.turn; G.aiPlayTurn(S,col,tier,null);
        if(S.mustPlace){ const c=S.mustPlace; outer:for(let f=0;f<3;f++)for(let r=0;r<8;r++)for(let cc=0;cc<8;cc++){const h=(c==='w')?r<=3:r>=4; if(h&&!G.at(S,f,r,cc)){G.addPiece('K',c,f,r,cc);S.kingOut[c]=true;break outer;}} S.mustPlace=null; }
        G.endTurn(S); }
      plies+=i;
      if(S.kingOut.w) kingOutW++; if(S.kingOut.b) kingOutB++;
      capsTot += S.captured.w.length + S.captured.b.length;
      genCapsTot += S.captured.w.filter(t=>t==='G').length + S.captured.b.filter(t=>t==='G').length;
      if(S.over){ if(S.over.reason==='checkmate')mate++; if(S.over.reason==='elimination')elim++;
        if(S.over.winner==='w')wWin++; else if(S.over.winner==='b')bWin++; else draws++; } else draws++;
    }
    return {tier,games,cap, wWin,bWin,draws,mate,elim,
      kingOutW,kingOutB, avgPlies:+(plies/games).toFixed(0),
      avgCaptures:+(capsTot/games).toFixed(1), avgGeneralsCaptured:+(genCapsTot/games).toFixed(2)};
  }, {tier,games,cap});
  out.errs=errs.length;
  console.log('DIAG '+JSON.stringify(out));
  await b.close();
})();
