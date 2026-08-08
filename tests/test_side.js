const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewportSize({width:1200,height:950});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/three-floor-chess.html'); await p.waitForTimeout(300);

  async function scenario(gtype, side, deploy){
    return await p.evaluate(async ({gtype,side,deploy})=>{
      const G=window.__game;
      // reset to menu
      document.getElementById('newBtn').click();
      await new Promise(r=>setTimeout(r,60));
      // pick game type
      document.querySelector(`#gameToggle .segbtn[data-g="${gtype}"]`).click();
      // pick side
      const sb=document.querySelector(`#sideSel .d[data-s="${side}"]`); if(sb) sb.click();
      // deploy if needed
      if(deploy){ document.getElementById('presetBtn').click(); }
      const startEnabled = !document.getElementById('startBtn').disabled;
      document.getElementById('startBtn').click();
      await new Promise(r=>setTimeout(r,1200)); // allow bot's first move if human is Black
      const S=G.S;
      return {
        myColor:G.myColor,
        startEnabled,
        turn:S.turn,
        over:S.over?S.over.reason:'none',
        wPieces:S.pieces.filter(x=>x.color==='w').length,
        bPieces:S.pieces.filter(x=>x.color==='b').length,
        actionsThisTurn:S.actionsThisTurn,
      };
    }, {gtype,side,deploy});
  }

  const results={};
  results['open/white'] = await scenario('open','w',true);
  results['open/black'] = await scenario('open','b',true);
  results['classic/black'] = await scenario('classic','b',false);
  results['pawnrace1/black'] = await scenario('pawnrace1','b',false);
  results['open/random'] = await scenario('open','rand',true);

  // screenshot open-as-black to eyeball orientation + that white(AI) has moved
  await scenario('open','b',true);
  await p.screenshot({path:'side_black.png'});

  console.log('ERRORS:', errs.length?errs.slice(0,4):'none');
  console.log(JSON.stringify(results,null,2));
  await b.close();
})();
