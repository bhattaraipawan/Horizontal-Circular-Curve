(function(){
  const $=id=>document.getElementById(id);
  const cv=$("cv"), ctx=cv.getContext("2d");
  const C={accent:"#167685",dark:"#0d4750",ink:"#2c3135",muted:"#8a9296",grid:"#e4ecec",tangent:"#9aa7a9"};

  const f2=x=>x.toFixed(2);
  // read a typed value safely: fall back to default if blank/NaN, clamp to [min,max] if given
  function num(id,def,min,max){
    let v=parseFloat($(id).value);
    if(!isFinite(v)) v=def;
    if(min!==undefined) v=Math.max(min,v);
    if(max!==undefined) v=Math.min(max,v);
    return v;
  }
  function sta(ft){                       // 1234.5 -> "12+34.50"
    const s=Math.floor(Math.abs(ft)/100), r=Math.abs(ft)-s*100;
    return (ft<0?"-":"")+s+"+"+r.toFixed(2).padStart(5,"0");
  }

  function compute(){
    const R=num("R",400,1), D=num("D",30,1,179), PIsta=num("PI",10000,0);
    const d=D*Math.PI/180, h=d/2;
    const T=R*Math.tan(h), L=R*d, E=R*(1/Math.cos(h)-1), M=R*(1-Math.cos(h)), LC=2*R*Math.sin(h);
    const Dc=5729.578/R;
    const PCsta=PIsta-T, PTsta=PCsta+L;
    return {R,D,h,T,L,E,M,LC,Dc,PCsta,PTsta};
  }

  function draw(s){
    const W=cv.width,H=cv.height,R=s.R,h=s.h;
    // geometry in math coords (y up), centre O at origin
    const PC={x:-R*Math.sin(h), y:R*Math.cos(h)};
    const PT={x: R*Math.sin(h), y:R*Math.cos(h)};
    const PI={x:0, y:R/Math.cos(h)};
    const MC={x:0, y:R};
    const O ={x:0, y:0};
    // extend tangents a bit beyond PC / PT for visual
    const ext=p=>({x:p.x+(p.x-PI.x)*0.28, y:p.y+(p.y-PI.y)*0.28});
    const bt=ext(PC), ft=ext(PT);
    // radius stubs (partway toward O)
    const stub=p=>({x:p.x+(O.x-p.x)*0.32, y:p.y+(O.y-p.y)*0.32});

    const pts=[PC,PT,PI,MC,bt,ft];
    let minX=Math.min(...pts.map(p=>p.x)), maxX=Math.max(...pts.map(p=>p.x));
    let minY=Math.min(...pts.map(p=>p.y)), maxY=Math.max(...pts.map(p=>p.y));
    const pad=46;
    const sx=(W-2*pad)/(maxX-minX||1), sy=(H-2*pad)/(maxY-minY||1);
    const sc=Math.min(sx,sy);
    const ox=pad+( (W-2*pad)-(maxX-minX)*sc )/2;
    const oy=pad+( (H-2*pad)-(maxY-minY)*sc )/2;
    const X=p=>ox+(p.x-minX)*sc;
    const Y=p=>H-(oy+(p.y-minY)*sc);          // flip y for canvas
    const P=p=>({x:X(p),y:Y(p)});

    ctx.clearRect(0,0,W,H);

    // tangents
    ctx.strokeStyle=C.tangent; ctx.lineWidth=2; ctx.setLineDash([]);
    line(P(bt),P(PI)); line(P(PI),P(ft));

    // radius stubs (dashed)
    ctx.strokeStyle="#c4d0d0"; ctx.lineWidth=1.2; ctx.setLineDash([5,4]);
    line(P(PC),P(stub(PC))); line(P(PT),P(stub(PT)));
    // mid-ordinate marker (chord midpoint -> arc midpoint)
    const chordMid={x:0,y:R*Math.cos(h)};
    line(P(chordMid),P(MC));
    ctx.setLineDash([]);

    // long chord
    ctx.strokeStyle="#cdd8d8"; ctx.lineWidth=1.4; line(P(PC),P(PT));

    // the arc (PC -> PT), drawn as polyline through circle
    ctx.strokeStyle=C.accent; ctx.lineWidth=3.5; ctx.beginPath();
    const a0=Math.atan2(PC.y-O.y,PC.x-O.x), a1=Math.atan2(PT.y-O.y,PT.x-O.x);
    const N=120;
    for(let i=0;i<=N;i++){
      const a=a0+(a1-a0)*i/N, pt=P({x:R*Math.cos(a),y:R*Math.sin(a)});
      i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y);
    }
    ctx.stroke();

    // points + labels
    dot(P(PI),C.dark,"PI","above");
    dot(P(PC),C.accent,"PC","left");
    dot(P(PT),C.accent,"PT","right");

    // T label on a tangent
    label(mid(P(PI),P(PC)),"T="+f2(s.T),C.muted,"left");
    // R label on a radius stub
    label(P(stub(PT)),"R="+f2(s.R),C.muted,"right");
    // E label between PI and MC
    label(mid(P(PI),P(MC)),"E="+f2(s.E),C.muted,"right");

    // helpers
    function line(a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    function mid(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
    function dot(p,col,txt,pos){
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,7);ctx.fill();
      ctx.font="600 12px ui-monospace,monospace";
      ctx.textBaseline="middle";
      if(pos==="above"){ctx.textAlign="center";ctx.fillText(txt,p.x,p.y-14);}
      else if(pos==="left"){ctx.textAlign="right";ctx.fillText(txt,p.x-9,p.y);}
      else{ctx.textAlign="left";ctx.fillText(txt,p.x+9,p.y);}
    }
    function label(p,txt,col,side){
      ctx.fillStyle=col;ctx.font="11px ui-monospace,monospace";ctx.textBaseline="middle";
      ctx.textAlign=side==="left"?"right":"left";
      ctx.fillText(txt, p.x+(side==="left"?-6:6), p.y);
    }
  }

  function render(){
    const s=compute();
    $("oT").textContent=f2(s.T)+" ft";
    $("oL").textContent=f2(s.L)+" ft";
    $("oLC").textContent=f2(s.LC)+" ft";
    $("oE").textContent=f2(s.E)+" ft";
    $("oM").textContent=f2(s.M)+" ft";
    $("oDc").textContent=f2(s.Dc)+"\u00b0";
    $("oPC").textContent=sta(s.PCsta);
    $("oPT").textContent=sta(s.PTsta);
    draw(s);
  }
  ["R","D","PI"].forEach(id=>$(id).addEventListener("input",render));
  render();
})();
