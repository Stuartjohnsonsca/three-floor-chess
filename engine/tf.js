// Fast standalone 3-floor tactics engine (for puzzle generation).
// Board: Int8Array(192), idx=f*64+r*8+c. White + / black -; P1 N2 B3 R4 Q5 K6.
// Mirrors the game's rules for the puzzle subset: standard in-floor moves, climbs to
// adjacent floor same (r,c) if empty (king never climbs), NO cross-floor attacks,
// turn = up to 3 actions (one per source floor), can't leave own king in check.
const P=1,N=2,B=3,R=4,Q=5,K=6;
const VAL=[0,100,320,330,500,900,0];
const KN=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const KG=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const BD=[[1,1],[1,-1],[-1,1],[-1,-1]], RD=[[1,0],[-1,0],[0,1],[0,-1]];
const ib=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const IDX=(f,r,c)=>f*64+r*8+c;

function fromPieces(pieces, stm){ const b=new Int8Array(192); const code={P,N,B,R,Q,K};
  for(const [t,col,f,r,c] of pieces) b[IDX(f,r,c)] = (col==='w'?1:-1)*code[t];
  return {b, stm: stm==='w'?1:-1}; }

function attacked(b,f,r,c,by){ // is (f,r,c) attacked by side `by` (1/-1), same floor only
  const pr=r-by; for(const dc of [-1,1]){ const cc=c+dc; if(ib(pr,cc)&&b[IDX(f,pr,cc)]===by*P) return true; }
  for(const[dr,dc]of KN){ const rr=r+dr,cc=c+dc; if(ib(rr,cc)&&b[IDX(f,rr,cc)]===by*N) return true; }
  for(const[dr,dc]of KG){ const rr=r+dr,cc=c+dc; if(ib(rr,cc)&&b[IDX(f,rr,cc)]===by*K) return true; }
  for(const[dr,dc]of BD){ let rr=r+dr,cc=c+dc; while(ib(rr,cc)){ const p=b[IDX(f,rr,cc)]; if(p){ if(p===by*B||p===by*Q)return true; break;} rr+=dr;cc+=dc; } }
  for(const[dr,dc]of RD){ let rr=r+dr,cc=c+dc; while(ib(rr,cc)){ const p=b[IDX(f,rr,cc)]; if(p){ if(p===by*R||p===by*Q)return true; break;} rr+=dr;cc+=dc; } }
  return false;
}
function kingIdx(b,side){ const k=side*K; for(let i=0;i<192;i++) if(b[i]===k) return i; return -1; }
function inCheck(b,side){ const ki=kingIdx(b,side); if(ki<0) return false; const f=(ki/64)|0, r=((ki%64)/8)|0, c=ki%8; return attacked(b,f,r,c,-side); }

// pseudo-legal single actions for `side` on floors not acted, pieces not already moved this turn.
// action: {from, to, cap, promo, floor, climb}
function genActions(s, floorsActed, movedSq){
  const b=s.b, side=s.stm, out=[];
  for(let f=0;f<3;f++){ if(floorsActed[f]) continue;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){ const i=IDX(f,r,c); const pc=b[i]; if(!pc||Math.sign(pc)!==side) continue; if(movedSq && movedSq.has(i)) continue;
      const t=Math.abs(pc);
      if(t===P){ const dir=side, start=side===1?1:6, promoR=side===1?7:0, r1=r+dir;
        if(ib(r1,c)&&b[IDX(f,r1,c)]===0){ out.push({from:i,to:IDX(f,r1,c),cap:0,promo:(r1===promoR?Q:0),floor:f,climb:false});
          if(r===start&&b[IDX(f,r+2*dir,c)]===0) out.push({from:i,to:IDX(f,r+2*dir,c),cap:0,promo:0,floor:f,climb:false}); }
        for(const dc of[-1,1]){ const cc=c+dc,rr=r+dir; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(tp&&Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:(rr===promoR?Q:0),floor:f,climb:false}); }
      } else if(t===N){ for(const[dr,dc]of KN){ const rr=r+dr,cc=c+dc; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(!tp||Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); } }
      else if(t===K){ for(const[dr,dc]of KG){ const rr=r+dr,cc=c+dc; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(!tp||Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); } }
      else { const dirs=t===B?BD:t===R?RD:KG; for(const[dr,dc]of dirs){ let rr=r+dr,cc=c+dc; while(ib(rr,cc)){ const tp=b[IDX(f,rr,cc)];
        if(!tp) out.push({from:i,to:IDX(f,rr,cc),cap:0,promo:0,floor:f,climb:false});
        else { if(Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); break; } rr+=dr;cc+=dc; } } }
      // climbs (not king)
      if(t!==K && !NOCLIMB){ for(const nf of [f-1,f+1]){ if(nf<0||nf>2)continue; const ni=IDX(nf,r,c); if(b[ni]===0) out.push({from:i,to:ni,cap:0,promo:0,floor:f,climb:true}); } }
    }
  }
  // filter king-safe
  const legal=[];
  for(const a of out){ const u=make(s,a); if(!inCheck(s.b,side)) legal.push(a); unmake(s,a,u); }
  return legal;
}
function make(s,a){ const b=s.b; const moved=b[a.from]; const u={cap:b[a.to], moved};
  b[a.to]= a.promo? Math.sign(moved)*a.promo : moved; b[a.from]=0; s.stm=-s.stm; return u; }
function unmake(s,a,u){ const b=s.b; b[a.from]=u.moved; b[a.to]=u.cap; s.stm=-s.stm; }

function material(b){ let m=0; for(let i=0;i<192;i++){ const p=b[i]; if(p) m+=Math.sign(p)*VAL[Math.abs(p)]; } return m; }

const MATE=100000;
let NODES=0, CAP=200000, capped=false, NOCLIMB=false, TT=null;
function keyOf(s,mL){ return s.stm+'|'+mL+'|'+Buffer.from(s.b.buffer,s.b.byteOffset,s.b.byteLength).toString('latin1'); }

// All values are from WHITE's perspective. White maximizes, Black minimizes.
// heroValue: White to move (fresh turn). White plays ONE action then ends the turn.
function heroValue(s, movesLeft, alpha, beta, ply){
  if(NODES>CAP){ capped=true; return material(s.b); }
  let key=null; if(TT && movesLeft>0){ key=keyOf(s,movesLeft); const v=TT.get(key); if(v!==undefined) return v; }
  const acts=genActions(s,[false,false,false],null);        // s.stm===White
  if(acts.length===0) return inCheck(s.b,1)? -(MATE-ply) : 0; // White has no move
  if(movesLeft===0) return material(s.b);
  let best=-MATE-2;
  for(const a of acts){ NODES++; if(NODES>CAP){capped=true;break;}
    const u=make(s,a);                                       // s.stm now Black
    const val=villainValue(s, movesLeft-1, alpha, beta, ply+1);
    unmake(s,a,u);
    if(val>best) best=val;
    if(!TT){ if(val>alpha) alpha=val; if(alpha>=beta) break; }
  }
  if(key!==null && !capped) TT.set(key,best);
  return best;
}
// villainValue: Black to move (fresh turn). Black plays a FULL turn (up to 3 actions), minimizing White.
function villainValue(s, movesLeft, alpha, beta, ply){
  if(NODES>CAP){ capped=true; return material(s.b); }
  let key=null; if(TT){ key=keyOf(s,movesLeft); const v=TT.get(key); if(v!==undefined) return v; }
  if(genActions(s,[false,false,false],null).length===0) return inCheck(s.b,-1)? (MATE-ply) : 0; // Black mated/staled
  let best=MATE+2;
  function rec(floorsActed, movedSq, count){
    if(NODES>CAP){ capped=true; return; }
    if(count>=1 && !inCheck(s.b,-1)){                        // Black may stop the turn here (king safe)
      s.stm=1;                                               // hand over to White
      const val=heroValue(s, movesLeft, alpha, beta, ply+1);
      s.stm=-1;
      if(val<best) best=val;
      if(!TT){ if(val<beta) beta=val; if(alpha>=beta) return; }
    }
    if(count>=3) return;
    const acts=genActions(s,floorsActed,movedSq);            // s.stm===Black here
    for(const a of acts){ NODES++; if(NODES>CAP){capped=true;return;}
      const u=make(s,a);                                     // s.stm -> White
      s.stm=-1;                                              // keep Black to move within the turn
      const fa=floorsActed.slice(); fa[a.floor]=true;
      const ms=new Set(movedSq); ms.add(a.to);
      rec(fa, ms, count+1);
      s.stm=1;                                               // restore post-make state for unmake
      unmake(s,a,u);                                         // s.stm -> Black
      if(!TT && alpha>=beta) return;
    }
  }
  rec([false,false,false], new Set(), 0);
  const res = (best===MATE+2)? (inCheck(s.b,-1)? (MATE-ply) : 0) : best;
  if(key!==null && !capped) TT.set(key,res);
  return res;
}

// public: forced mate for white within heroMoves? returns {score, mate, capped, nodes}
function solveMate(pieces, heroMoves, cap, useTT){
  const s=fromPieces(pieces,'w'); NODES=0; CAP=cap||200000; capped=false;
  TT = useTT!==false ? new Map() : null;
  const score=heroValue(s, heroMoves, -MATE-2, MATE+2, 0);
  TT=null;
  return {score, mate: score>MATE-1000, capped, nodes:NODES};
}
module.exports={fromPieces,genActions,make,unmake,inCheck,material,solveMate,attacked,IDX,MATE};

if(require.main===module){
  // sanity: M2 forced mate in 2 but not 1
  const M2=[['K','b',1,0,0],['R','w',1,1,7],['R','w',0,5,5],['K','w',2,7,0]];
  console.log('M2 mate1:', solveMate(M2,1,50000));
  console.log('M2 mate2:', solveMate(M2,2,300000));
}

// ---- material tactics: forced material gain under full 3-action defense ----
// quiescence: resolve capturing exchanges (single captures, alternating) approximately.
function genCaptures(s){ const b=s.b, side=s.stm, out=[];
  for(let f=0;f<3;f++)for(let r=0;r<8;r++)for(let c=0;c<8;c++){ const i=IDX(f,r,c); const pc=b[i]; if(!pc||Math.sign(pc)!==side)continue; const t=Math.abs(pc);
    if(t===P){ for(const dc of[-1,1]){ const rr=r+side,cc=c+dc; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(tp&&Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:(rr===(side===1?7:0)?Q:0),floor:f,climb:false}); } }
    else if(t===N){ for(const[dr,dc]of KN){ const rr=r+dr,cc=c+dc; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(tp&&Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); } }
    else if(t===K){ for(const[dr,dc]of KG){ const rr=r+dr,cc=c+dc; if(!ib(rr,cc))continue; const tp=b[IDX(f,rr,cc)]; if(tp&&Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); } }
    else { const dirs=t===B?BD:t===R?RD:KG; for(const[dr,dc]of dirs){ let rr=r+dr,cc=c+dc; while(ib(rr,cc)){ const tp=b[IDX(f,rr,cc)]; if(tp){ if(Math.sign(tp)===-side) out.push({from:i,to:IDX(f,rr,cc),cap:tp,promo:0,floor:f,climb:false}); break;} rr+=dr;cc+=dc; } } }
  }
  const legal=[]; for(const a of out){ const u=make(s,a); if(!inCheck(s.b,-s.stm)) legal.push(a); unmake(s,a,u); } return legal;
}
function qsearch(s, alpha, beta){ const stand = s.stm===1? material(s.b) : -material(s.b);
  if(stand>=beta) return beta; if(stand>alpha) alpha=stand;
  const caps=genCaptures(s); caps.sort((a,b)=>VAL[Math.abs(b.cap)]-VAL[Math.abs(a.cap)]);
  for(const a of caps){ const u=make(s,a); const sc=-qsearch(s,-beta,-alpha); unmake(s,a,u); if(sc>=beta)return beta; if(sc>alpha)alpha=sc; }
  return alpha; // side-to-move POV
}
function heroMat(s, k, alpha, beta){ if(NODES>CAP){capped=true; return material(s.b);}
  const acts=genActions(s,[false,false,false],null);
  if(acts.length===0) return inCheck(s.b,1)? -MATE : 0;
  if(k===0){ const q=qsearch(s,-1e9,1e9); return s.stm===1?q:-q; } // White POV
  let best=-1e9;
  for(const a of acts){ NODES++; if(NODES>CAP){capped=true;break;} const u=make(s,a);
    const val=villainMat(s,k-1,alpha,beta); unmake(s,a,u);
    if(val>best)best=val; if(val>alpha)alpha=val; if(alpha>=beta)break; }
  return best;
}
function villainMat(s, k, alpha, beta){ if(NODES>CAP){capped=true; return material(s.b);}
  if(genActions(s,[false,false,false],null).length===0) return inCheck(s.b,-1)? MATE : 0;
  let best=1e9; const villain=s.stm;
  (function rec(fa,ms,count){ if(NODES>CAP){capped=true;return;}
    if(count>=1 && !inCheck(s.b,-1)){ s.stm=1; const val=heroMat(s,k,alpha,beta); s.stm=-1; if(val<best)best=val; if(val<beta)beta=val; if(alpha>=beta)return; }
    if(count>=3)return;
    const acts=genActions(s,fa,ms);
    for(const a of acts){ NODES++; if(NODES>CAP){capped=true;return;} const u=make(s,a); s.stm=-1;
      const nf=fa.slice(); nf[a.floor]=true; const nm=new Set(ms); nm.add(a.to);
      rec(nf,nm,count+1); s.stm=1; unmake(s,a,u); if(alpha>=beta)return; }
  })([false,false,false], new Set(), 0);
  if(best===1e9) return inCheck(s.b,-1)? MATE : 0;
  return best;
}
function solveMaterial(pieces, heroMoves, cap, noClimb){ const s=fromPieces(pieces,'w'); NODES=0; CAP=cap||300000; capped=false; NOCLIMB=!!noClimb;
  const start=material(s.b); const val=heroMat(s, heroMoves, -1e9, 1e9); NOCLIMB=false;
  return { gain: val-start, val, start, capped, nodes:NODES };
}
module.exports.solveMaterial=solveMaterial;

// ---- ONE-ACTION-per-turn tactics (Tactics Lab variant): classic forks/skewers/material ----
function heroMat1(s,k,alpha,beta){ if(NODES>CAP){capped=true;return material(s.b);}
  const acts=genActions(s,[false,false,false],null);
  if(acts.length===0) return inCheck(s.b,1)? -MATE : 0;
  if(k===0){ const q=qsearch(s,-1e9,1e9); return s.stm===1?q:-q; }
  let best=-1e9;
  for(const a of acts){ NODES++; if(NODES>CAP){capped=true;break;} const u=make(s,a);
    const val=villainMat1(s,k-1,alpha,beta); unmake(s,a,u);
    if(val>best)best=val; if(val>alpha)alpha=val; if(alpha>=beta)break; }
  return best;
}
function villainMat1(s,k,alpha,beta){ if(NODES>CAP){capped=true;return material(s.b);}
  const acts=genActions(s,[false,false,false],null);
  if(acts.length===0) return inCheck(s.b,-1)? MATE : 0;   // black mated (white POV +)
  let best=1e9;
  for(const a of acts){ NODES++; if(NODES>CAP){capped=true;break;} const u=make(s,a);
    const val=heroMat1(s,k,alpha,beta); unmake(s,a,u);
    if(val<best)best=val; if(val<beta)beta=val; if(alpha>=beta)break; }
  return best;
}
function solveMaterial1(pieces,heroMoves,cap,noClimb){ const s=fromPieces(pieces,'w'); NODES=0;CAP=cap||300000;capped=false;NOCLIMB=!!noClimb;
  const start=material(s.b); const val=heroMat1(s,heroMoves,-1e9,1e9); NOCLIMB=false;
  return {gain:val-start,val,start,capped,nodes:NODES};
}
module.exports.solveMaterial1=solveMaterial1;
