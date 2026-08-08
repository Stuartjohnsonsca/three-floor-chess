const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
  const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/three-floor-chess.html'); await p.waitForTimeout(300);
  const out = await p.evaluate(async ()=>{
    const G=window.__game; const V={P:1,N:3,B:3,R:5,Q:9,K:0,G:0};
    // 1) invariant + shield check over many built armies
    let bad=[]; let checked=0;
    for(let iter=0;iter<40;iter++){ for(const color of ['w','b']){
      const army=G.presetFor(color); checked++;
      const home=color==='w'?0:7, pawnR=color==='w'?1:6;
      const pts=army.reduce((s,q)=>s+V[q.type],0);
      const gens=army.filter(q=>q.type==='G').length;
      const pawnsFloor=[0,1,2].map(f=>army.filter(q=>q.type==='P'&&q.floor===f).length);
      // shield: every officer (not P/G) on home rank has a pawn same floor/col on pawnR
      const officers=army.filter(q=>q.type!=='P'&&q.type!=='G');
      const unshielded=officers.filter(o=> !army.some(q=>q.type==='P'&&q.floor===o.floor&&q.c===o.c&&q.r===pawnR));
      const offBadRank=officers.filter(o=>o.r!==home).length;
      if(pts>90) bad.push(`${color} pts ${pts}`);
      if(gens!==3) bad.push(`${color} gens ${gens}`);
      if(pawnsFloor.some(n=>n<3)) bad.push(`${color} pawns/floor ${pawnsFloor}`);
      if(unshielded.length) bad.push(`${color} unshielded ${unshielded.length}`);
      if(offBadRank) bad.push(`${color} offRank ${offBadRank}`);
    }}
    // 2) real game: play as Black, let bot (White) open; captured must stay empty a few turns
    function playBlackOpening(plies){
      document.getElementById('newBtn').click();
      document.querySelector('#gameToggle .segbtn[data-g="open"]').click();
      document.querySelector('#sideSel .d[data-s="b"]').click();
      // deploy human (black) via preset, add AI white, run turns with the real AI for both sides
      const S=G.S;
      for(const q of G.presetFor('b')) S.pieces.push(q);
      for(const q of G.presetFor('w')) S.pieces.push(q);
      S.turn='w'; G.goPlay();
      let capW=0, capB=0;
      for(let i=0;i<plies && !S.over;i++){
        const col=S.turn; G.aiPlayTurn(S,col,800,null);
        if(S.mustPlace){ const c=S.mustPlace; outer:for(let f=0;f<3;f++)for(let r=0;r<8;r++)for(let cc=0;cc<8;cc++){const h=(c==='w')?r<=3:r>=4; if(h&&!G.at(S,f,r,cc)){G.addPiece('K',c,f,r,cc);S.kingOut[c]=true;break outer;}} S.mustPlace=null; }
        G.endTurn(S);
      }
      return {capturedByWhite:S.captured.w.length, capturedByBlack:S.captured.b.length, afterPlies:plies, over:S.over?S.over.reason:'none'};
    }
    const t1 = playBlackOpening(1);   // just White's first turn
    const t6 = playBlackOpening(6);   // three full moves each
    return {checked, badCount:bad.length, badSample:bad.slice(0,6), t1, t6};
  });
  out.errs=errs.slice(0,3);
  console.log(JSON.stringify(out,null,2));
  await b.close();
})();
