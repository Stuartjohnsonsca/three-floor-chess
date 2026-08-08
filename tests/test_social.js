const http=require('http'), fs=require('fs'), path=require('path');
const { chromium } = require('playwright');
const html=fs.readFileSync('/home/claude/three-floor-chess.html');
const server=http.createServer((req,res)=>{ res.setHeader('Content-Type','text/html'); res.end(html); });
(async()=>{
  await new Promise(r=>server.listen(8137,r));
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const ctx=await b.newContext(); const page=await ctx.newPage(); const errs=[];
  page.on('pageerror',e=>errs.push('PE:'+e.message));
  page.on('console',m=>{ if(m.type()==='error' && !/Failed to load resource|net::|peerjs|gstatic|firebase/i.test(m.text())) errs.push('C:'+m.text()); });
  await page.goto('http://localhost:8137/'); await page.waitForTimeout(500);

  const out={};
  out.bootChip = await page.textContent('#acctChip');
  out.mode = await page.evaluate(()=>window.__game && typeof PUZZLES!=='undefined' ? 'game-ok' : 'game-missing');

  async function signup(user,email,pw){
    await page.click('#acctChip'); await page.waitForTimeout(150);
    // ensure signup tab
    await page.evaluate(()=>{ const l=document.getElementById('swapLink'); if(document.getElementById('authTitle').textContent!=='Create account' && l) l.click(); });
    await page.fill('#authUser',user); await page.fill('#authEmail',email); await page.fill('#authPw',pw);
    await page.click('#authGo'); await page.waitForTimeout(400);
    return page.textContent('#acctChip');
  }
  async function logout(){ await page.click('#acctChip'); await page.waitForTimeout(150); await page.click('#logoutBtn'); await page.waitForTimeout(200); }
  async function login(email,pw){
    await page.click('#acctChip'); await page.waitForTimeout(150);
    await page.evaluate(()=>{ const l=document.getElementById('swapLink'); if(document.getElementById('authTitle').textContent!=='Log in' && l) l.click(); });
    await page.fill('#authEmail',email); await page.fill('#authPw',pw); await page.click('#authGo'); await page.waitForTimeout(400);
    return page.textContent('#acctChip');
  }

  out.aliceChip = await signup('alice','a@a.com','pw123456');
  await logout();
  out.bobChip = await signup('bob','b@b.com','pw123456');
  await logout();
  out.aliceLogin = await login('a@a.com','pw123456');
  // search + add bob
  await page.click('#acctChip'); await page.waitForTimeout(200);           // open social
  await page.fill('#friendSearch','bob'); await page.click('#friendSearchBtn'); await page.waitForTimeout(250);
  out.searchFound = await page.textContent('#searchResults');
  await page.click('#searchResults [data-add]'); await page.waitForTimeout(200);
  await page.click('#socialClose');
  await logout();
  // bob accepts
  out.bobLogin = await login('b@b.com','pw123456');
  await page.click('#acctChip'); await page.waitForTimeout(250);
  out.bobRequests = await page.textContent('#requestList');
  await page.click('#requestList [data-acc]'); await page.waitForTimeout(250);
  out.bobFriends = await page.textContent('#friendList');
  out.leaderboard = await page.textContent('#leaderList');
  await page.click('#socialClose');

  // regression: puzzles + a bot move
  out.reg = await page.evaluate(()=>{ const G=window.__game; let e=null;
    try{ G.setGameType('pawnrace1'); G.startGame(); G.aiPlayTurn('w',2000);}catch(x){e=x.message;}
    return {puzzles:(typeof PUZZLES!=='undefined')?PUZZLES.length:-1, err:e}; });

  console.log(JSON.stringify(out,null,1));
  console.log('ERRORS:', errs.slice(0,6));
  await b.close(); server.close();
})();
