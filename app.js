(function(){
  "use strict";
  var ROUNDS=10;
  var $=function(s){return document.querySelector(s)};
  var AVATARS=["🦊","🐯","🐨","🐼","🦁","🐸","🐵","🦄","🐶","🐱","🐧","🐝","🌟","🚀","🦖","🐙"];

  /* ---------- Speicher ---------- */
  function storageWarning(message){var el=$("#storageStatus");if(!el)return;el.textContent=message;el.hidden=!message;}
  function load(k,d){return LernsterneStorage.load(k,d)}
  function save(k,v){var ok=LernsterneStorage.save(k,v);if(!ok)storageWarning("Der Lernstand konnte nicht gespeichert werden. Bitte schaffe Speicherplatz und erstelle einen Sicherungscode.");return ok}
  var profiles=load("antona_profiles",[]);
  if(!Array.isArray(profiles))profiles=[];
  profiles=profiles.filter(function(p){return p&&typeof p==="object"&&!Array.isArray(p);});
  var activeId=load("antona_active",null);
  function active(){return profiles.filter(function(p){return p.id===activeId})[0]||null;}
  function persist(){var ok=save("antona_profiles",profiles)&&save("antona_active",activeId);if(ok)storageWarning("");return ok;}
  function blankStats(){return {stars:0,coins:0,rounds:0,correct:0,best:{math:0,read:0,shape:0,clock:0,english:0,tr:0,denken:0,sach:0,musik:0,geo:0},history:{},ballonBest:0,streak:0,lastDay:"",quizBest:0,goal:10,unlocked:[],lastChest:""};}
  profiles.forEach(function(p){ // alte Profile um neue Felder ergänzen
    if(!p.stats||typeof p.stats!=="object"||Array.isArray(p.stats))p.stats=blankStats();if(!p.stats.best||typeof p.stats.best!=="object"||Array.isArray(p.stats.best))p.stats.best={};if(!p.stats.history||typeof p.stats.history!=="object"||Array.isArray(p.stats.history))p.stats.history={};
    if(p.stats.coins===undefined)p.stats.coins=0;if(p.stats.ballonBest===undefined)p.stats.ballonBest=0;if(p.stats.blitzBest===undefined)p.stats.blitzBest=0;
    if(p.stats.streak===undefined)p.stats.streak=0;if(p.stats.lastDay===undefined)p.stats.lastDay="";if(p.stats.badges===undefined)p.stats.badges={};
    if(p.stats.quizBest===undefined)p.stats.quizBest=0;if(p.stats.goal===undefined)p.stats.goal=10;if(!p.stats.unlocked)p.stats.unlocked=[];
    if(p.stats.lastChest===undefined)p.stats.lastChest="";
    ["math","read","shape","clock","english","tr","denken","sach","musik","geo"].forEach(function(k){if(p.stats.best[k]===undefined)p.stats.best[k]=0;});
  });
  function dayKey(d){d=d||new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function bumpStreak(p){var today=dayKey();if(p.stats.lastDay===today)return;var y=new Date();y.setDate(y.getDate()-1);
    p.stats.streak=(p.stats.lastDay===dayKey(y))?(p.stats.streak||0)+1:1;p.stats.lastDay=today;}

  /* ---------- Sound (WebAudio) ---------- */
  var actx=null, soundOn=load("antona_sound",true);
  function tone(freq,dur,type){
    if(!soundOn)return;
    try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
      var o=actx.createOscillator(),g=actx.createGain();o.type=type||"sine";o.frequency.value=freq;
      o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.0001,actx.currentTime);
      g.gain.exponentialRampToValueAtTime(.2,actx.currentTime+.02);
      g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur);
      o.start();o.stop(actx.currentTime+dur);}catch(e){}
  }
  function sCorrect(){tone(660,.12);setTimeout(function(){tone(880,.16)},90);}
  function sWrong(){tone(200,.18,"triangle");}
  function sStar(){tone(1040,.1);setTimeout(function(){tone(1320,.12)},80);}

  /* ---------- Vorlesen: beste deutsche Stimme wählen ---------- */
  var deVoice=null,enVoice=null;
  function bestVoice(list,prefs){
    for(var i=0;i<prefs.length;i++)for(var j=0;j<list.length;j++)
      if((list[j].name||"").indexOf(prefs[i])!==-1)return list[j];
    var online=list.filter(function(v){return v.localService===false}); // Online-Stimmen klingen meist natürlicher
    return online[0]||list[0];
  }
  function chooseVoice(){
    try{var vs=window.speechSynthesis.getVoices();if(!vs||!vs.length)return;
      var de=vs.filter(function(v){return /^de(-|_|$)/i.test(v.lang||"");});
      var en=vs.filter(function(v){return /^en(-|_|$)/i.test(v.lang||"");});
      var saved=load("antona_voice","");
      if(de.length){var sv=saved?de.filter(function(v){return v.name===saved;})[0]:null;
        deVoice=sv||bestVoice(de,["Google Deutsch","Microsoft Katja Online","Microsoft Katja","Microsoft Hedda","Natural","Anna","Petra","Katja","Vicki","Markus"]);}
      if(en.length)enVoice=bestVoice(en,["Google US English","Microsoft Aria Online","Google UK English Female","Microsoft Jenny","Samantha","Aria"]);
    }catch(e){}
  }
  function populateVoices(){try{var sel=$("#voicePick");if(!sel)return;var vs=window.speechSynthesis.getVoices()||[],de=vs.filter(function(v){return /^de/i.test(v.lang||"");}),saved=load("antona_voice","");sel.innerHTML="";
    if(!de.length){var o=document.createElement("option");o.value="";o.textContent="Standard-Stimme des Geräts";sel.appendChild(o);return;}
    de.forEach(function(v){var o=document.createElement("option");o.value=v.name;o.textContent=v.name+(v.localService===false?" (online, natürlicher)":"");if(v.name===saved)o.selected=true;sel.appendChild(o);});}catch(e){}}
  try{if("speechSynthesis"in window){chooseVoice();window.speechSynthesis.onvoiceschanged=function(){chooseVoice();populateVoices();};}}catch(e){}
  function speak(t,lang){try{if(!("speechSynthesis"in window))return;window.speechSynthesis.cancel();
    if(!deVoice&&!enVoice)chooseVoice();
    var en=(lang&&lang.indexOf("en")===0);
    var u=new SpeechSynthesisUtterance(t);u.lang=en?"en-US":"de-DE";var v=en?enVoice:deVoice;if(v)u.voice=v;
    u.rate=en?.9:.92;u.pitch=1.1;u.volume=1;window.speechSynthesis.speak(u);}catch(e){}}

  /* ---------- Maskottchen ---------- */
  function drawMascot(mood){
    var eyes = mood==="happy"
      ? '<path d="M35 46 q5 -7 10 0" stroke="#1f2433" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M55 46 q5 -7 10 0" stroke="#1f2433" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<circle cx="40" cy="47" r="3.5" fill="#1f2433"/><circle cx="60" cy="47" r="3.5" fill="#1f2433"/>';
    var mouth = mood==="sad"
      ? '<path d="M40 64 q10 -8 20 0" stroke="#1f2433" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<path d="M40 60 q10 10 20 0" stroke="#1f2433" stroke-width="3" fill="none" stroke-linecap="round"/>';
    $("#mascot").innerHTML=
      '<polygon points="50,8 61,38 93,38 67,57 77,90 50,70 23,90 33,57 7,38 39,38" fill="#ffc02e" stroke="#f0a500" stroke-width="2"/>'
      +'<circle cx="50" cy="50" r="22" fill="#fff"/>'+eyes+mouth
      +(mood==="happy"?'<circle cx="33" cy="56" r="3" fill="#ffb3b3"/><circle cx="67" cy="56" r="3" fill="#ffb3b3"/>':'');
  }

  /* ---------- Hilfen ---------- */
  function rnd(n){return Math.floor(Math.random()*n)}
  function pick(a){return a[rnd(a.length)]}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=a[j];a[j]=t}return a}
  function uniq(correct,make,n){var set=[correct],g=0;while(set.length<n&&g++<200){var v=make();if(set.indexOf(v)===-1)set.push(v)}return shuffle(set);}
  function numOpts(c,spread){spread=spread||2;return uniq(c,function(){var d=c+(rnd(spread*2+1)-spread);return d<0?c+1+rnd(3):d},3).map(String);}

  /* ---------- MATHE (forschungsbasiert: sehen → rechnen) ---------- */
  var MCOL={a:"#ff6b6b",b:"#2aa7ff",one:"#ff8a3d"};
  function dotsSVG(n,color,per){per=per||5;var gap=22,rad=8,pad=8,cols=Math.min(n,per)||1,rows=Math.max(1,Math.ceil(n/per));
    var w=cols*gap+pad*2,h=rows*gap+pad*2,s="";for(var i=0;i<n;i++){var r=Math.floor(i/per),c=i%per;
      s+='<circle cx="'+(pad+rad+c*gap)+'" cy="'+(pad+rad+r*gap)+'" r="'+rad+'" fill="'+color+'"/>';}
    return '<svg viewBox="0 0 '+w+' '+h+'" aria-hidden="true" style="height:auto;max-height:5.5rem;max-width:42vw;width:auto;vertical-align:middle">'+s+'</svg>';}
  function tenFrameSVG(n,color,ghost){var gap=28,rad=10,pad=6,per=5,w=per*gap+pad*2,h=2*gap+pad*2,s="";
    for(var i=0;i<10;i++){var r=Math.floor(i/per),c=i%per,x=pad+c*gap,y=pad+r*gap;
      s+='<rect x="'+x+'" y="'+y+'" width="'+gap+'" height="'+gap+'" fill="none" stroke="#cfd6e6" stroke-width="2"/>';
      if(i<n)s+='<circle cx="'+(x+gap/2)+'" cy="'+(y+gap/2)+'" r="'+rad+'" fill="'+color+'"/>';
      else if(ghost)s+='<circle cx="'+(x+gap/2)+'" cy="'+(y+gap/2)+'" r="'+rad+'" fill="none" stroke="#c7cde0" stroke-width="2" stroke-dasharray="3 3"/>';}
    return '<svg viewBox="0 0 '+w+' '+h+'" aria-hidden="true" style="width:min(16rem,78vw);height:auto">'+s+'</svg>';}

  function m_subitize(){var n=1+rnd(6);return{label:"Wie viele Punkte siehst du?",speak:"Wie viele Punkte siehst du?",
    render:function(z){z.className="question";z.innerHTML='<div style="padding:.4rem 0">'+dotsSVG(n,MCOL.one,3)+'</div>';},options:numOpts(n),correct:String(n),three:true};}
  function m_tenframe(){var n=1+rnd(10);return{label:"Wie viele Punkte im Zehnerfeld?",speak:"Wie viele Punkte sind im Zehnerfeld?",
    render:function(z){z.className="question";z.innerHTML=tenFrameSVG(n,MCOL.a,false);},options:numOpts(n),correct:String(n),three:true};}
  function m_bond(){var n=1+rnd(9),miss=10-n;return{label:"Wie viele fehlen bis 10?",speak:"Wie viele Punkte fehlen bis zehn?",
    render:function(z){z.className="question";z.innerHTML=tenFrameSVG(n,MCOL.b,true);},options:numOpts(miss),correct:String(miss),three:true};}
  function m_add(max){return function(){var a=1+rnd(Math.floor(max/2)),b=1+rnd(max-a>0?max-a:1),res=a+b;
    return{label:"Zähle alle Punkte zusammen",speak:"Wie viel ist "+a+" plus "+b+"?",
      render:function(z){z.className="question";z.innerHTML='<div style="display:flex;align-items:center;justify-content:center;gap:.45rem;flex-wrap:wrap;font-family:\'Fredoka\',sans-serif">'
        +dotsSVG(a,MCOL.a)+'<span style="font-size:2rem">+</span>'+dotsSVG(b,MCOL.b)+'<span style="font-size:2rem">=&nbsp;?</span></div><div style="font-size:1.3rem;margin-top:.4rem">'+a+" + "+b+" = ?</div>";},
      options:numOpts(res),correct:String(res),three:true};};}
  function m_sub(max){return function(){var t=3+rnd(max-2),k=1+rnd(t-1),res=t-k;
    return{label:"Die hellen Punkte sind weg. Wie viele bleiben?",speak:"Wie viel ist "+t+" minus "+k+"?",
      render:function(z){z.className="question";var gap=22,rad=9,pad=8,per=5,cols=Math.min(t,per),rows=Math.ceil(t/per),w=cols*gap+pad*2,h=rows*gap+pad*2,s="";
        for(var i=0;i<t;i++){var r=Math.floor(i/per),c=i%per,x=pad+rad+c*gap,y=pad+rad+r*gap,gone=i>=t-k;
          s+='<circle cx="'+x+'" cy="'+y+'" r="'+rad+'" fill="'+(gone?"#dfe3ef":MCOL.one)+'"/>';
          if(gone)s+='<line x1="'+(x-rad)+'" y1="'+(y-rad)+'" x2="'+(x+rad)+'" y2="'+(y+rad)+'" stroke="#ff5d6c" stroke-width="2.5"/>';}
        z.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" aria-hidden="true" style="height:auto;max-height:6.5rem;width:auto;max-width:80vw">'+s+'</svg><div style="font-size:1.3rem;margin-top:.4rem;font-family:\'Fredoka\',sans-serif">'+t+" − "+k+" = ?</div>";},
      options:numOpts(res),correct:String(res),three:true};};}
  function m_add100(){var a=10+rnd(80),b=1+rnd(99-a),res=a+b;return{label:"Rechne aus",speak:"Wie viel ist "+a+" plus "+b+"?",
    render:function(z){z.className="question";z.textContent=a+" + "+b+" = ?";},options:numOpts(res,8),correct:String(res),three:true};}
  function m_sub100(){var t=20+rnd(80),k=1+rnd(t-1),res=t-k;return{label:"Rechne aus",speak:"Wie viel ist "+t+" minus "+k+"?",
    render:function(z){z.className="question";z.textContent=t+" − "+k+" = ?";},options:numOpts(res,8),correct:String(res),three:true};}
  function m_double(){var a=2+rnd(23),res=a*2;return{label:"Verdopple die Zahl",speak:"Das Doppelte von "+a,
    render:function(z){z.className="question";z.textContent=a+" + "+a+" = ?";},options:numOpts(res,6),correct:String(res),three:true};}
  function m_compare(){var a=1+rnd(99),b=1+rnd(99),c=a<b?"<":a>b?">":"=";return{label:"Welches Zeichen passt?",speak:"Vergleiche "+a+" und "+b,
    render:function(z){z.className="question";z.innerHTML='<span style="font-size:2.6rem">'+a+' &nbsp;?&nbsp; '+b+'</span>';},options:["<",">","="],correct:c,three:true};}
  function m_times(tables){return function(){var a=pick(tables),b=1+rnd(10),res=a*b;
    var opts=uniq(res,function(){var d=b+(rnd(5)-2);if(d<1)d=b+1;return a*d;},3).map(String);
    return{label:"Male (Einmaleins)",speak:a+" mal "+b,render:function(z){z.className="question";z.textContent=a+" × "+b+" = ?";},options:opts,correct:String(res),three:true};};}
  function m_tens(){var plus=Math.random()<0.5,x,y,res;
    if(plus){x=1+rnd(8);y=1+rnd(9-x>0?9-x:1);res=(x+y)*10;}else{x=3+rnd(6);y=1+rnd(x-1);res=(x-y)*10;}
    x*=10;y*=10;return{label:"Rechne mit Zehnern",speak:x+(plus?" plus ":" minus ")+y,
      render:function(z){z.className="question";z.textContent=x+(plus?" + ":" − ")+y+" = ?";},options:numOpts(res,10),correct:String(res),three:true};}
  function m_money(){function amt(){return (1+rnd(8))+(rnd(2)?0.5:0);}
    function fmt(x){var e=Math.floor(x);return (x-e>=0.5)?e+",50 €":e+" €";}
    var a=amt(),b=amt(),res=a+b;
    return{label:"Rechne mit Geld",speak:"Wie viel ist "+fmt(a)+" plus "+fmt(b)+"?",
      render:function(z){z.className="question";z.textContent=fmt(a)+" + "+fmt(b)+" = ?";},
      options:uniq(res,function(){return res+(rnd(2)?0.5:-0.5)*(1+rnd(4));},3).map(fmt),correct:fmt(res),word:true,three:true};}
  function m_div(){var b=2+rnd(8),c=2+rnd(8),a=b*c;return{label:"Teile (Division)",speak:a+" geteilt durch "+b,render:function(z){z.className="question";z.textContent=a+" : "+b+" = ?";},options:numOpts(c,3),correct:String(c),three:true};}
  function m_missing(){var plus=Math.random()<0.5,a,res,miss;
    if(plus){a=2+rnd(15);miss=2+rnd(15);res=a+miss;return{label:"Welche Zahl fehlt?",speak:a+" plus wie viel ergibt "+res+"?",render:function(z){z.className="question";z.textContent=a+" + ☐ = "+res;},options:numOpts(miss,3),correct:String(miss),three:true};}
    res=2+rnd(15);miss=1+rnd(res-1);a=res+miss;return{label:"Welche Zahl fehlt?",speak:a+" minus wie viel ergibt "+res+"?",render:function(z){z.className="question";z.textContent=a+" − ☐ = "+res;},options:numOpts(miss,3),correct:String(miss),three:true};}
  function m_three(){var a=1+rnd(8),b=1+rnd(8),c=1+rnd(8),res=a+b+c;return{label:"Rechne alle zusammen",speak:a+" plus "+b+" plus "+c,render:function(z){z.className="question";z.textContent=a+" + "+b+" + "+c+" = ?";},options:numOpts(res,3),correct:String(res),three:true};}
  var MATH_LVL={
    1:{title:"Mengen & Zehnerfeld",desc:"Punkte sehen und zählen",set:[m_subitize,m_tenframe,m_bond]},
    8:{title:"Zehnerzahlen",desc:"20 + 30, 70 − 40 …",set:[m_tens]},
    11:{title:"Experte: Teilen, ☐, 3 Zahlen",desc:"Division, fehlende Zahl, 4+3+2",set:[m_div,m_missing,m_three,m_add100]},
    9:{title:"Mit Geld rechnen (€)",desc:"3,50 € + 2 € …",set:[m_money]},
    10:{title:"Profi: gemischt & schwer",desc:"12 + 42, 76 − 38, Einmaleins, Geld",set:[m_add100,m_sub100,m_tens,m_times([2,3,4,5,6,7,8,9,10]),m_money]},
    2:{title:"Plus & Minus bis 10",desc:"Mit Punktebildern",set:[m_add(10),m_add(10),m_sub(10)]},
    3:{title:"Plus & Minus bis 20",desc:"Etwas größere Zahlen",set:[m_add(18),m_sub(18),m_add(18)]},
    4:{title:"Plus & Minus bis 100",desc:"2. Klasse: große Zahlen",set:[m_add100,m_sub100,m_add100,m_sub100,m_double]},
    5:{title:"Größer, kleiner, gleich",desc:"Zahlen bis 100 vergleichen",set:[m_compare]},
    6:{title:"Einmaleins 2 · 5 · 10",desc:"Die leichten Reihen",set:[m_times([2,5,10])]},
    7:{title:"Einmaleins gemischt",desc:"Alle Reihen bis 10",set:[m_times([2,3,4,5,6,7,8,9,10])]}
  };

  /* ---------- LESEN ---------- */
  var WORDS=[{w:"Apfel",e:"🍎"},{w:"Ball",e:"⚽"},{w:"Baum",e:"🌳"},{w:"Blume",e:"🌸"},{w:"Hund",e:"🐶"},{w:"Katze",e:"🐱"},
    {w:"Maus",e:"🐭"},{w:"Fisch",e:"🐟"},{w:"Sonne",e:"☀️"},{w:"Stern",e:"⭐"},{w:"Haus",e:"🏠"},{w:"Auto",e:"🚗"},
    {w:"Banane",e:"🍌"},{w:"Ente",e:"🦆"},{w:"Igel",e:"🦔"},{w:"Uhr",e:"⏰"},{w:"Elefant",e:"🐘"},{w:"Nase",e:"👃"},
    {w:"Tasse",e:"🍵"},{w:"Robbe",e:"🦭"},{w:"Krone",e:"👑"},{w:"Pilz",e:"🍄"},{w:"Schaf",e:"🐑"},
    {w:"Brot",e:"🍞"},{w:"Milch",e:"🥛"},{w:"Vogel",e:"🐦"},{w:"Wolke",e:"☁️"},{w:"Mond",e:"🌙"},{w:"Käfer",e:"🐞"},{w:"Blatt",e:"🍀"},{w:"Herz",e:"❤️"}];
  function r_anlaut(){var it=pick(WORDS),L=it.w.charAt(0).toUpperCase();
    return{label:"Mit welchem Buchstaben beginnt das Wort?",speak:"Mit welchem Buchstaben beginnt "+it.w+"?",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span>'+it.w;},
      options:uniq(L,function(){return pick("BHKMSATELINOFRUPDGZÄÖÜ".split(""))},3),correct:L,three:true};}
  function r_word(){var right=pick(WORDS),others=shuffle(WORDS.filter(function(x){return x.w!==right.w})).slice(0,2),opts=shuffle([right].concat(others));
    return{label:"Welches Wort passt zum Bild?",speak:"Welches Wort passt zum Bild?",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+right.e+'</span>';},
      options:opts.map(function(o){return o.w}),correct:right.w,word:true,three:true};}
  function syll(w){var m=w.toLowerCase().match(/[aeiouäöü]+/g);return m?m.length:1;}
  function r_syll(){var it=pick(WORDS.filter(function(x){return x.w.length>3})),n=syll(it.w);
    return{label:"Wie viele Silben hat das Wort?",speak:"Wie viele Silben hat "+it.w+"? Klatsche mit.",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span>'+it.w;},
      options:uniq(n,function(){return 1+rnd(4)},3).map(String),correct:String(n),three:true};}
  var SPECIAL=[{w:"Käse",e:"🧀",L:"ä"},{w:"Bär",e:"🐻",L:"ä"},{w:"Mädchen",e:"👧",L:"ä"},{w:"Löwe",e:"🦁",L:"ö"},
    {w:"Vögel",e:"🐦",L:"ö"},{w:"Öl",e:"🫒",L:"ö"},{w:"Tür",e:"🚪",L:"ü"},{w:"Tüte",e:"🛍️",L:"ü"},{w:"Müll",e:"🗑️",L:"ü"},
    {w:"Fuß",e:"🦶",L:"ß"},{w:"Straße",e:"🛣️",L:"ß"},{w:"Nuss",e:"🌰",L:"ß"}];
  function r_umlaut(){var it=pick(SPECIAL);
    return{label:"Welcher besondere Buchstabe steckt im Wort?",speak:"Welcher besondere Buchstabe steckt in "+it.w+"?",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span>'+it.w;},
      options:uniq(it.L,function(){return pick(["ä","ö","ü","ß"])},3),correct:it.L,three:true};}
  function r_case(){var right=pick(WORDS),other=pick(WORDS.filter(function(x){return x.w!==right.w;}));
    return{label:"Nomen schreibt man groß. Welches ist richtig?",speak:"Welches Wort ist richtig geschrieben?",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+right.e+'</span>';},
      options:shuffle([right.w,right.w.toLowerCase(),other.w.toLowerCase()]),correct:right.w,word:true,three:true};}
  var RHYMES=[["Haus","Maus"],["Baum","Traum"],["Katze","Tatze"],["Ball","Knall"],["Fisch","Tisch"],["Hose","Rose"],["Licht","Gesicht"],["Hand","Sand"],["Bär","Meer"]];
  function r_rhyme(){var pair=pick(RHYMES),others=shuffle(RHYMES.filter(function(p){return p!==pair;})).slice(0,2);
    return{label:"Was reimt sich auf „"+pair[0]+"“?",speak:"Was reimt sich auf "+pair[0]+"?",
      render:function(z){z.className="question";z.innerHTML='<div style="font-size:2rem">'+pair[0]+' – ?</div>';},
      options:shuffle([pair[1],others[0][1],others[1][0]]),correct:pair[1],word:true,three:true};}
  var SENT=[{s:"Die Katze trinkt …",e:"🐱",a:["Milch","Auto","Stein"]},{s:"Der Hund frisst einen …",e:"🦴",a:["Knochen","Baum","Mond"]},
    {s:"Die Sonne ist am …",e:"☀️",a:["Himmel","Teller","Schuh"]},{s:"Im Winter fällt der …",e:"❄️",a:["Schnee","Apfel","Ball"]},
    {s:"Der Fisch schwimmt im …",e:"🐟",a:["Wasser","Bett","Baum"]},{s:"Das Kind liest ein …",e:"📖",a:["Buch","Brot","Haus"]}];
  function r_sentence(){var it=pick(SENT);return{label:it.s,speak:it.s,render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span>';},
    options:shuffle(it.a.slice()),correct:it.a[0],word:true,three:true};}
  function r_dikt(){var it=pick(WORDS),w=it.w,wrong=[];
    var lw=w.toLowerCase();if(lw!==w)wrong.push(lw);
    var sw=w.replace("a","e").replace("o","u").replace("i","e");if(sw!==w&&wrong.indexOf(sw)<0)wrong.push(sw);
    var dbl=w.charAt(0)+w;if(wrong.indexOf(dbl)<0)wrong.push(dbl);
    wrong=shuffle(wrong).slice(0,2);while(wrong.length<2)wrong.push((w.slice(0,-1)||w)+"n");
    return{label:"Hör das Wort und wähle die richtige Schreibweise",speak:w,speakLang:"de",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span><div class="muted" style="font-size:.85rem">Tippe 🔊 zum Nochmal-Hören</div>';},
      options:shuffle([w].concat(wrong)),correct:w,word:true,three:true};}
  var COMP=[{w:"Haustür",a:"Haus",b:"Tür"},{w:"Fußball",a:"Fuß",b:"Ball"},{w:"Sonnenblume",a:"Sonne",b:"Blume"},{w:"Regenbogen",a:"Regen",b:"Bogen"},{w:"Apfelsaft",a:"Apfel",b:"Saft"},{w:"Schneemann",a:"Schnee",b:"Mann"},{w:"Baumhaus",a:"Baum",b:"Haus"},{w:"Taschenlampe",a:"Tasche",b:"Lampe"}];
  function r_compound(){var it=pick(COMP),rest=shuffle(COMP.filter(function(x){return x!==it;})),o1=rest[0],o2=rest[1];
    return{label:"Aus welchen zwei Wörtern besteht „"+it.w+"“?",speak:"Woraus besteht das Wort "+it.w+"?",render:function(z){z.className="question";z.innerHTML='<div style="font-size:1.9rem">'+it.w+'</div>';},
      options:shuffle([it.a+" + "+it.b,o1.a+" + "+o1.b,it.a+" + "+o2.b]),correct:it.a+" + "+it.b,word:true,three:true};}
  var SYN=[{w:"froh",s:"glücklich",x:["traurig","müde"]},{w:"schnell",s:"flink",x:["langsam","leise"]},{w:"groß",s:"riesig",x:["klein","rund"]},{w:"schön",s:"hübsch",x:["hässlich","kalt"]},{w:"leise",s:"still",x:["laut","bunt"]},{w:"klug",s:"schlau",x:["dumm","nass"]}];
  function r_syn(){var it=pick(SYN);return{label:"Welches Wort bedeutet das Gleiche wie „"+it.w+"“?",speak:"Was bedeutet das Gleiche wie "+it.w+"?",render:function(z){z.className="question";z.innerHTML='<div style="font-size:1.9rem">'+it.w+'</div>';},
    options:shuffle([it.s].concat(it.x)),correct:it.s,word:true,three:true};}
  var READ_LVL={
    1:{title:"Anlaute",desc:"Erster Buchstabe",set:[r_anlaut]},
    2:{title:"Wörter erkennen",desc:"Wort zum Bild finden",set:[r_word,r_anlaut]},
    3:{title:"Silben",desc:"Silben zählen",set:[r_syll,r_word]},
    4:{title:"Umlaute & ß",desc:"ä, ö, ü und ß",set:[r_umlaut]},
    5:{title:"Groß & klein",desc:"Nomen schreibt man groß",set:[r_case]},
    6:{title:"Reimwörter",desc:"Was reimt sich?",set:[r_rhyme]},
    7:{title:"Erste Sätze",desc:"Satz sinnvoll ergänzen",set:[r_sentence]},
    8:{title:"Profi: alles gemischt",desc:"Sätze, Reime, ä/ö/ü, groß/klein",set:[r_sentence,r_rhyme,r_umlaut,r_case]},
    9:{title:"Diktat (hören)",desc:"Wort hören, richtig schreiben",set:[r_dikt]},
    10:{title:"Experte: Wortschatz",desc:"Zusammengesetzte Wörter & Synonyme",set:[r_compound,r_syn]}
  };

  /* ---------- FORMEN & FARBEN ---------- */
  var SHAPES={Kreis:'<circle cx="60" cy="60" r="46"/>',Quadrat:'<rect x="16" y="16" width="88" height="88" rx="6"/>',
    Dreieck:'<polygon points="60,14 108,104 12,104"/>',Rechteck:'<rect x="10" y="30" width="100" height="60" rx="6"/>',
    Stern:'<polygon points="60,10 73,46 112,46 80,70 92,108 60,84 28,108 40,70 8,46 47,46"/>',
    Herz:'<path d="M60 104 L22 64 a22 22 0 0 1 38 -22 a22 22 0 0 1 38 22 Z"/>',
    Oval:'<ellipse cx="60" cy="60" rx="50" ry="32"/>',Raute:'<polygon points="60,12 104,60 60,108 16,60"/>',
    Sechseck:'<polygon points="60,12 103,36 103,84 60,108 17,84 17,36"/>',Fünfeck:'<polygon points="60,12 106,46 88,104 32,104 14,46"/>'};
  var COLORS=[{n:"Rot",c:"#ff5b5b"},{n:"Blau",c:"#2aa7ff"},{n:"Grün",c:"#19b36b"},{n:"Gelb",c:"#ffc02e"},{n:"Lila",c:"#b07bff"},{n:"Orange",c:"#ff8a3d"}];
  function svgShape(p,c){return '<svg class="art" viewBox="0 0 120 120" aria-hidden="true"><g fill="'+c+'">'+p+'</g></svg>';}
  function s_color(){var names=Object.keys(SHAPES),sh=pick(names),col=pick(COLORS);
    return{label:"Welche Farbe hat die Form?",speak:"Welche Farbe hat die Form?",
      render:function(z){z.className="question";z.innerHTML=svgShape(SHAPES[sh],col.c);},
      options:uniq(col.n,function(){return pick(COLORS).n},3),correct:col.n,three:true};}
  function s_shape(){var names=Object.keys(SHAPES),sh=pick(names),col=pick(COLORS);
    return{label:"Wie heißt diese Form?",speak:"Wie heißt diese Form?",
      render:function(z){z.className="question";z.innerHTML=svgShape(SHAPES[sh],col.c);},
      options:uniq(sh,function(){return pick(names)},3),correct:sh,word:true,three:true};}
  var SHAPE_LVL={1:{title:"Farben",desc:"Farben benennen",set:[s_color]},2:{title:"Formen",desc:"Formen benennen",set:[s_shape]},3:{title:"Gemischt",desc:"Formen und Farben",set:[s_color,s_shape]},
    4:{title:"Experte: schwere Formen",desc:"Raute, Sechseck, Oval …",set:[s_shape,s_shape,s_color]}};

  /* ---------- UHR ---------- */
  function clockSVG(h,m){var cx=60,cy=60;
    function hand(len,ang,w,col){var r=(ang-90)*Math.PI/180;return '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+len*Math.cos(r)).toFixed(1)+'" y2="'+(cy+len*Math.sin(r)).toFixed(1)+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"/>';}
    var ticks="";for(var i=0;i<12;i++){var a=i*30*Math.PI/180;ticks+='<circle cx="'+(cx+46*Math.sin(a)).toFixed(1)+'" cy="'+(cy-46*Math.cos(a)).toFixed(1)+'" r="2.3" fill="#aab2c8"/>';}
    var nums="";[[12,0],[3,90],[6,180],[9,270]].forEach(function(p){var a=p[1]*Math.PI/180;nums+='<text x="'+(cx+37*Math.sin(a)).toFixed(1)+'" y="'+(cy-37*Math.cos(a)+5).toFixed(1)+'" font-size="13" font-family="Fredoka,sans-serif" font-weight="600" fill="#6b7488" text-anchor="middle">'+p[0]+'</text>';});
    var minAng=m*6,hourAng=(h%12)*30+m*.5;
    return '<svg class="art" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="55" fill="#fff" stroke="#dbe0ee" stroke-width="4"/>'+ticks+nums+hand(26,hourAng,5,"#b07bff")+hand(38,minAng,3.5,"#ff8a3d")+'<circle cx="60" cy="60" r="4" fill="#1f2433"/></svg>';}
  function timeWords(h,m){var hh=((h+11)%12)+1;if(m===0)return hh+" Uhr";if(m===30)return "halb "+(hh%12+1);if(m===15)return "Viertel nach "+hh;if(m===45)return "Viertel vor "+(hh%12+1);return hh+" Uhr "+m;}
  function clockGen(mins){return function(){var h=1+rnd(12),m=pick(mins),correct=timeWords(h,m);
    return{label:"Wie spät ist es?",speak:"Wie spät ist es?",render:function(z){z.className="question";z.innerHTML=clockSVG(h,m);},
      options:uniq(correct,function(){return timeWords(1+rnd(12),pick(mins.concat([0,30])))},3),correct:correct,word:true,three:true};};}
  function pad2(n){return (n<10?"0":"")+n;}
  function c_digital(){var h=1+rnd(12),m=pick([0,5,10,15,20,25,30,35,40,45,50,55]),correct=h+":"+pad2(m);
    return{label:"Lies die digitale Uhrzeit",speak:"Wie spät ist es?",render:function(z){z.className="question";z.innerHTML=clockSVG(h,m);},
      options:uniq(correct,function(){var h2=1+rnd(12),m2=pick([0,5,10,15,20,25,30,35,40,45,50,55]);return h2+":"+pad2(m2);},3),correct:correct,word:true,three:true};}
  var CLOCK_LVL={1:{title:"Volle Stunden",desc:"3 Uhr, 7 Uhr …",set:[clockGen([0])]},2:{title:"Halbe Stunden",desc:"halb 4 …",set:[clockGen([0,30])]},3:{title:"Viertelstunden",desc:"Viertel nach/vor",set:[clockGen([0,15,30,45])]},
    4:{title:"Minuten genau (digital)",desc:"3:05, 7:40 …",set:[c_digital]},
    5:{title:"Experte: jede Minute",desc:"4:17, 9:53 …",set:[c_dig_any]}};
  function c_dig_any(){var h=1+rnd(12),m=rnd(60),correct=h+":"+pad2(m);return{label:"Lies die Uhrzeit ganz genau",speak:"Wie spät ist es?",render:function(z){z.className="question";z.innerHTML=clockSVG(h,m);},
    options:uniq(correct,function(){return (1+rnd(12))+":"+pad2(rnd(60));},3),correct:correct,word:true,three:true};}

  /* ---------- ENGLISCH (hören & zuordnen) ---------- */
  var EN_COLORS=[{de:"Rot",en:"Red",e:"🟥"},{de:"Blau",en:"Blue",e:"🟦"},{de:"Grün",en:"Green",e:"🟩"},{de:"Gelb",en:"Yellow",e:"🟨"},
    {de:"Schwarz",en:"Black",e:"⬛"},{de:"Weiß",en:"White",e:"⬜"},{de:"Rosa",en:"Pink",e:"🟪"},{de:"Orange",en:"Orange",e:"🟧"}];
  var EN_ANIMALS=[{de:"Hund",en:"Dog",e:"🐶"},{de:"Katze",en:"Cat",e:"🐱"},{de:"Fisch",en:"Fish",e:"🐟"},{de:"Vogel",en:"Bird",e:"🐦"},
    {de:"Kuh",en:"Cow",e:"🐮"},{de:"Pferd",en:"Horse",e:"🐴"},{de:"Bär",en:"Bear",e:"🐻"},{de:"Ente",en:"Duck",e:"🦆"},{de:"Schwein",en:"Pig",e:"🐷"},{de:"Löwe",en:"Lion",e:"🦁"}];
  var EN_NUM=[{n:1,en:"One"},{n:2,en:"Two"},{n:3,en:"Three"},{n:4,en:"Four"},{n:5,en:"Five"},{n:6,en:"Six"},{n:7,en:"Seven"},{n:8,en:"Eight"},{n:9,en:"Nine"},{n:10,en:"Ten"}];
  var EN_FOOD=[{de:"Apfel",en:"Apple",e:"🍎"},{de:"Brot",en:"Bread",e:"🍞"},{de:"Milch",en:"Milk",e:"🥛"},{de:"Ei",en:"Egg",e:"🥚"},{de:"Käse",en:"Cheese",e:"🧀"},{de:"Banane",en:"Banana",e:"🍌"},{de:"Wasser",en:"Water",e:"💧"},{de:"Fisch",en:"Fish",e:"🐟"}];
  var EN_BODY=[{de:"Hand",en:"Hand",e:"✋"},{de:"Auge",en:"Eye",e:"👁️"},{de:"Nase",en:"Nose",e:"👃"},{de:"Mund",en:"Mouth",e:"👄"},{de:"Ohr",en:"Ear",e:"👂"},{de:"Fuß",en:"Foot",e:"🦶"},{de:"Zahn",en:"Tooth",e:"🦷"},{de:"Haar",en:"Hair",e:"💇"}];
  var EN_PHRASE=[{de:"Hallo",en:"Hello",e:"👋"},{de:"Tschüss",en:"Goodbye",e:"🙋"},{de:"Danke",en:"Thank you",e:"🙏"},{de:"Bitte",en:"Please",e:"😊"},{de:"Ja",en:"Yes",e:"✅"},{de:"Nein",en:"No",e:"❌"}];
  var EN_WEATHER=[{de:"Sonne",en:"Sun",e:"☀️"},{de:"Regen",en:"Rain",e:"🌧️"},{de:"Schnee",en:"Snow",e:"❄️"},{de:"Wind",en:"Wind",e:"💨"},{de:"Wolke",en:"Cloud",e:"☁️"}];
  function e_vocab(list){return function(){var it=pick(list),others=shuffle(list.filter(function(x){return x.en!==it.en})).slice(0,2),opts=shuffle([it].concat(others));
    return{label:"Wie heißt das auf Englisch?",speak:it.en,speakLang:"en",
      render:function(z){z.className="question";z.innerHTML='<span class="em">'+it.e+'</span><span style="font-size:1.05rem;color:var(--ink-soft);font-weight:800">'+it.de+'</span>';},
      options:opts.map(function(o){return o.en}),correct:it.en,word:true,three:true};};}
  function e_num(){var it=pick(EN_NUM),others=shuffle(EN_NUM.filter(function(x){return x.n!==it.n})).slice(0,2),opts=shuffle([it].concat(others));
    return{label:"Welche Zahl auf Englisch?",speak:it.en,speakLang:"en",
      render:function(z){z.className="question";z.innerHTML='<span style="font-size:3.4rem;font-family:\'Fredoka\',sans-serif">'+it.n+'</span>';},
      options:opts.map(function(o){return o.en}),correct:it.en,word:true,three:true};}
  var EN_NUM2=[{n:11,en:"Eleven"},{n:12,en:"Twelve"},{n:13,en:"Thirteen"},{n:14,en:"Fourteen"},{n:15,en:"Fifteen"},{n:16,en:"Sixteen"},{n:17,en:"Seventeen"},{n:18,en:"Eighteen"},{n:19,en:"Nineteen"},{n:20,en:"Twenty"}];
  function e_num2(){var it=pick(EN_NUM2),others=shuffle(EN_NUM2.filter(function(x){return x.n!==it.n;})).slice(0,2),opts=shuffle([it].concat(others));
    return{label:"Welche Zahl auf Englisch?",speak:it.en,speakLang:"en",render:function(z){z.className="question";z.innerHTML='<span style="font-size:3.4rem;font-family:\'Fredoka\',sans-serif">'+it.n+'</span>';},
      options:opts.map(function(o){return o.en}),correct:it.en,word:true,three:true};}
  var ENGLISH_LVL={
    1:{title:"Farben (Colours)",desc:"Rot, Blau, Grün …",set:[e_vocab(EN_COLORS)]},
    2:{title:"Tiere (Animals)",desc:"Hund, Katze, Fisch …",set:[e_vocab(EN_ANIMALS)]},
    3:{title:"Zahlen (Numbers)",desc:"1 bis 10",set:[e_num]},
    4:{title:"Essen (Food)",desc:"Apfel, Brot, Milch …",set:[e_vocab(EN_FOOD)]},
    5:{title:"Körper (Body)",desc:"Hand, Auge, Nase …",set:[e_vocab(EN_BODY)]},
    6:{title:"Alles gemischt",desc:"Alle Themen zusammen",set:[e_vocab(EN_COLORS),e_vocab(EN_ANIMALS),e_num,e_vocab(EN_FOOD),e_vocab(EN_BODY)]},
    7:{title:"Zahlen 11–20",desc:"Eleven … Twenty",set:[e_num2]},
    8:{title:"Profi: alles & 1–20",desc:"Alle Themen + Zahlen bis 20",set:[e_vocab(EN_COLORS),e_vocab(EN_ANIMALS),e_num,e_num2,e_vocab(EN_FOOD),e_vocab(EN_BODY)]},
    9:{title:"Experte: Wörter & Sätze",desc:"Begrüßung, Wetter, alles",set:[e_vocab(EN_PHRASE),e_vocab(EN_WEATHER),e_num2,e_vocab(EN_ANIMALS),e_vocab(EN_BODY)]}
  };

  /* ---------- DENKEN & KONZENTRATION (Kompetenzbereich „Muster und Strukturen" + Aufmerksamkeit) ---------- */
  var SYMS=["🔴","🟡","🔵","🟢","🟣","🟠","⭐","❤️","🔺","⬛"];
  function d_pattern(){
    var pool=shuffle(SYMS).slice(0,4),per=2+rnd(2),base=pool.slice(0,per),len=per*2+rnd(2)+1,seq=[];
    for(var i=0;i<len;i++)seq.push(base[i%per]);
    var next=base[len%per],opts=uniq(next,function(){return pick(pool);},3);
    return{label:"Wie geht das Muster weiter?",speak:"Wie geht das Muster weiter?",
      render:function(z){z.className="question";z.innerHTML='<div style="font-size:2.1rem;letter-spacing:.15rem">'+seq.join(" ")+' <span style="opacity:.45">❓</span></div>';},
      options:opts,correct:next,word:true,three:true};
  }
  function d_numseq(){
    var step=pick([1,2,2,5,10,-1,-2]),start=step>0?1+rnd(10):25+rnd(30),seq=[];
    for(var i=0;i<4;i++)seq.push(start+step*i);
    var next=start+step*4;if(next<0)return d_numseq();
    return{label:"Welche Zahl kommt als Nächstes?",speak:"Welche Zahl kommt als Nächstes?",
      render:function(z){z.className="question";z.innerHTML='<div style="font-size:1.9rem">'+seq.join(" · ")+' · <span style="opacity:.45">?</span></div>';},
      options:numOpts(next,Math.max(2,Math.abs(step))),correct:String(next),three:true};
  }
  var CAT={Obst:["🍎","🍌","🍇","🍓","🍊","🍐"],Tiere:["🐶","🐱","🐭","🐰","🐻","🦊"],Fahrzeuge:["🚗","🚌","🚲","✈️","🚂","🚢"],Formen:["🔴","🟦","🔺","⭐","⬛","🟣"]};
  function d_odd(){
    var keys=Object.keys(CAT),mainK=pick(keys),oddK=pick(keys.filter(function(k){return k!==mainK;}));
    var pick3=shuffle(CAT[mainK]).slice(0,3),odd=pick(CAT[oddK]),opts=shuffle(pick3.concat([odd]));
    return{label:"Was passt nicht dazu?",speak:"Welches passt nicht dazu?",
      render:function(z){z.className="question";z.innerHTML='<div style="font-size:1.3rem;opacity:.7">Tippe das, was nicht dazugehört.</div>';},
      options:opts,correct:odd,word:true};
  }
  function d_same(){
    var a=pick(SYMS),b=pick(SYMS.filter(function(s){return s!==a;})),target=a+b;
    var w1=a+pick(SYMS.filter(function(s){return s!==b&&s!==a;})),w2=pick(SYMS.filter(function(s){return s!==a;}))+b;
    return{label:"Welches ist genau gleich?",speak:"Finde das gleiche Zeichen.",
      render:function(z){z.className="question";z.innerHTML='<div style="font-size:2.6rem">'+target+'</div>';},
      options:shuffle([target,w1,w2]),correct:target,word:true,three:true};
  }
  var DENK_LVL={
    1:{title:"Muster fortsetzen",desc:"Was kommt als Nächstes?",set:[d_pattern]},
    2:{title:"Zahlenreihen",desc:"Die nächste Zahl finden",set:[d_numseq]},
    3:{title:"Was passt nicht?",desc:"Den Ausreißer finden",set:[d_odd]},
    4:{title:"Finde das Gleiche",desc:"Genau hinschauen (Konzentration)",set:[d_same]},
    5:{title:"Alles gemischt",desc:"Muster, Reihen & Logik",set:[d_pattern,d_numseq,d_odd,d_same]},
    6:{title:"Experte: schwere Reihen",desc:"Verdoppeln, größere Schritte",set:[d_seq2,d_numseq,d_pattern]}
  };
  function d_seq2(){var mode=rnd(3),seq=[],next,a;
    if(mode===0){var s=2+rnd(5),st=3+rnd(4);for(a=0;a<4;a++)seq.push(s+st*a);next=s+st*4;}
    else if(mode===1){a=1+rnd(3);for(var i=0;i<4;i++){seq.push(a);a*=2;}next=a;}
    else{var bb=24+rnd(30),dd=3+rnd(4);for(a=0;a<4;a++)seq.push(bb-dd*a);next=bb-dd*4;if(next<0)next=0;}
    return{label:"Welche Zahl kommt als Nächstes?",speak:"Welche Zahl kommt als Nächstes?",render:function(z){z.className="question";z.innerHTML='<div style="font-size:1.8rem">'+seq.join(" · ")+' · ?</div>';},
      options:numOpts(next,Math.max(2,Math.abs(next-seq[3]))),correct:String(next),three:true};}

  /* ---------- SACHKUNDE (Sachunterricht 2. Klasse) ---------- */
  function qa(pool){return function(){var it=pick(pool),opts=shuffle(it.a.slice());
    return{label:it.q,speak:it.q,render:function(z){z.className="question";z.innerHTML='<span class="em">'+(it.e||"🌍")+'</span>';},
      options:opts,correct:it.a[0],word:true,three:true};};}
  var SACH_TIERE=[{q:"Welches Tier macht Muh?",e:"🐮",a:["Kuh","Katze","Ente"]},{q:"Wo lebt ein Fisch?",e:"🐟",a:["Im Wasser","Im Baum","In der Luft"]},
    {q:"Welches Tier kann fliegen?",e:"🐦",a:["Vogel","Hund","Schaf"]},{q:"Wie viele Beine hat eine Spinne?",e:"🕷️",a:["8","6","4"]},
    {q:"Welches Tier hat einen Rüssel?",e:"🐘",a:["Elefant","Pferd","Hase"]},{q:"Was frisst ein Hase gern?",e:"🐰",a:["Karotten","Fleisch","Steine"]},
    {q:"Welches Baby gehört zum Hund?",e:"🐶",a:["Welpe","Kalb","Küken"]},{q:"Wo wohnt die Biene?",e:"🐝",a:["Im Bienenstock","Im Meer","Unter der Erde"]}];
  var SACH_KOERPER=[{q:"Womit siehst du?",e:"👁️",a:["Mit den Augen","Mit den Ohren","Mit der Nase"]},{q:"Womit hörst du?",e:"👂",a:["Mit den Ohren","Mit den Augen","Mit dem Mund"]},
    {q:"Womit riechst du?",e:"👃",a:["Mit der Nase","Mit der Hand","Mit dem Fuß"]},{q:"Wie viele Finger hat eine Hand?",e:"✋",a:["5","4","10"]},
    {q:"Was tust du vor dem Essen?",e:"🧼",a:["Hände waschen","Fernsehen","Springen"]},{q:"Wie oft Zähne putzen am Tag?",e:"🦷",a:["2-mal","Nie","Einmal pro Woche"]},
    {q:"Was ist gesund?",e:"🍎",a:["Obst","Nur Süßigkeiten","Chips"]}];
  var SACH_JAHR=[{q:"Wann schneit es?",e:"❄️",a:["Winter","Sommer","Frühling"]},{q:"Wann fallen bunte Blätter?",e:"🍂",a:["Herbst","Sommer","Winter"]},
    {q:"Was ziehst du bei Regen an?",e:"🌧️",a:["Regenjacke","Badehose","Nichts"]},{q:"Wann ist es am wärmsten?",e:"☀️",a:["Sommer","Winter","Herbst"]},
    {q:"Wie viele Jahreszeiten gibt es?",e:"🗓️",a:["4","2","12"]},{q:"Wann blühen die Blumen?",e:"🌷",a:["Frühling","Winter","Nie"]},
    {q:"Wie viele Tage hat eine Woche?",e:"📅",a:["7","5","10"]}];
  var SACH_VERKEHR=[{q:"Bei welcher Ampelfarbe darfst du gehen?",e:"🚦",a:["Grün","Rot","Gelb"]},{q:"Was tust du bei Rot?",e:"🚦",a:["Stehen bleiben","Schnell laufen","Winken"]},
    {q:"Wo überquerst du sicher die Straße?",e:"🦓",a:["Am Zebrastreifen","Zwischen Autos","Überall"]},{q:"Was trägst du beim Radfahren?",e:"🚲",a:["Helm","Hut","Krone"]},
    {q:"Vor dem Überqueren schaust du …",e:"👀",a:["Links und rechts","Nur nach oben","Gar nicht"]},{q:"Welche Farbe heißt Stopp?",e:"🔴",a:["Rot","Grün","Blau"]}];
  var SACH_PROFI=[{q:"Wie viele Beine hat ein Insekt?",e:"🐞",a:["6","8","4"]},{q:"Was brauchen Pflanzen zum Wachsen?",e:"🌱",a:["Wasser und Sonne","Nur Dunkelheit","Schokolade"]},
    {q:"Wohin gehört Altpapier?",e:"♻️",a:["In die Papiertonne","In die Natur","Ins Wasser"]},{q:"Was passiert mit Wasser in der Sonne?",e:"💧",a:["Es verdunstet","Es wird hart","Es wird blau"]},
    {q:"Was ist ein Säugetier?",e:"🐄",a:["Die Kuh","Der Fisch","Der Vogel"]},{q:"Welches Tier legt Eier?",e:"🐔",a:["Huhn","Kuh","Hund"]},
    {q:"Wann ist Mittag?",e:"🕛",a:["12 Uhr","6 Uhr","Mitternacht"]}];
  var SACH_LVL={
    1:{title:"Tiere & Natur",desc:"Tiere, Beine, Zuhause …",set:[qa(SACH_TIERE)]},
    2:{title:"Mein Körper & Sinne",desc:"Sehen, hören, gesund sein",set:[qa(SACH_KOERPER)]},
    3:{title:"Jahreszeiten & Wetter",desc:"Winter, Sommer, Regen …",set:[qa(SACH_JAHR)]},
    4:{title:"Verkehr & Sicherheit",desc:"Ampel, Zebrastreifen, Helm",set:[qa(SACH_VERKEHR)]},
    5:{title:"Alles gemischt",desc:"Alle Themen zusammen",set:[qa(SACH_TIERE.concat(SACH_KOERPER,SACH_JAHR,SACH_VERKEHR))]},
    6:{title:"Profi: schwere Fragen",desc:"Insekten, Pflanzen, Recycling …",set:[qa(SACH_PROFI.concat(SACH_TIERE,SACH_JAHR))]}
  };

  /* ---------- MUSIK ---------- */
  var MUS_INSTR=[{q:"Welches Instrument ist das?",e:"🎸",a:["Gitarre","Trommel","Flöte"]},{q:"Welches Instrument ist das?",e:"🥁",a:["Trommel","Geige","Klavier"]},
    {q:"Welches Instrument ist das?",e:"🎹",a:["Klavier","Gitarre","Trompete"]},{q:"Welches Instrument ist das?",e:"🎺",a:["Trompete","Flöte","Trommel"]},
    {q:"Welches Instrument ist das?",e:"🎻",a:["Geige","Gitarre","Klavier"]},{q:"Welches Instrument ist das?",e:"🪇",a:["Rassel","Klavier","Trompete"]}];
  function m_pitch(){var high=Math.random()<0.5;return{label:"Ist der Ton hoch oder tief?",speak:"Ist der Ton hoch oder tief?",speakLang:"",
    render:function(z){z.className="question";z.innerHTML='<span class="em">'+(high?"🔼":"🔽")+'</span><button class="read-btn" id="toneBtn" aria-label="Ton abspielen">🔊</button>';
      setTimeout(function(){tone(high?880:220,.5);var tb=document.getElementById("toneBtn");if(tb)tb.addEventListener("click",function(){tone(high?880:220,.5);});},200);},
    options:shuffle(["Hoch","Tief"]),correct:high?"Hoch":"Tief"};}
  var MUS_PROFI=[{q:"Welches Instrument wird gestrichen?",e:"🎻",a:["Geige","Trommel","Trompete"]},{q:"Welches Instrument hat Tasten?",e:"🎹",a:["Klavier","Gitarre","Flöte"]},
    {q:"Welches Instrument wird geblasen?",e:"🎺",a:["Trompete","Trommel","Geige"]},{q:"Was ist laut?",e:"🔊",a:["Ein Donner","Ein Flüstern","Eine Feder"]},
    {q:"Womit gibt man den Takt an?",e:"🥁",a:["Trommel","Flöte","Geige"]}];
  var MUSIK_LVL={1:{title:"Instrumente",desc:"Gitarre, Trommel …",set:[qa(MUS_INSTR)]},2:{title:"Hoch oder tief?",desc:"Töne hören",set:[m_pitch]},
    3:{title:"Gemischt",desc:"Instrumente & Töne",set:[qa(MUS_INSTR),m_pitch]},
    4:{title:"Profi: Instrumenten-Arten",desc:"Streichen, blasen, Tasten …",set:[qa(MUS_PROFI),m_pitch,qa(MUS_INSTR)]}};
  /* ---------- GEOGRAFIE ---------- */
  var GEO_FLAG=[{q:"Zu welchem Land gehört die Flagge?",e:"🇩🇪",a:["Deutschland","Frankreich","Italien"]},{q:"Zu welchem Land gehört die Flagge?",e:"🇫🇷",a:["Frankreich","Spanien","Türkei"]},
    {q:"Zu welchem Land gehört die Flagge?",e:"🇮🇹",a:["Italien","Deutschland","England"]},{q:"Zu welchem Land gehört die Flagge?",e:"🇹🇷",a:["Türkei","Spanien","Frankreich"]},
    {q:"Zu welchem Land gehört die Flagge?",e:"🇪🇸",a:["Spanien","Italien","Deutschland"]},{q:"Zu welchem Land gehört die Flagge?",e:"🇬🇧",a:["England","USA","Frankreich"]}];
  var GEO_WELT=[{q:"Auf welchem Planeten leben wir?",e:"🌍",a:["Erde","Mars","Mond"]},{q:"Was ist das größte Tier im Meer?",e:"🐋",a:["Wal","Hai","Fisch"]},
    {q:"Wo ist es sehr kalt und eisig?",e:"🧊",a:["Am Nordpol","In der Wüste","Am Strand"]},{q:"Wo leben Kamele?",e:"🐪",a:["In der Wüste","Im Eis","Im Meer"]},
    {q:"Was ist ganz oben am Himmel am Tag?",e:"☀️",a:["Die Sonne","Der Mond","Die Sterne"]},{q:"Wie heißt viel Wasser mit Salz?",e:"🌊",a:["Das Meer","Der Fluss","Der See"]}];
  var GEO_FLAG2=[{q:"Zu welchem Land gehört die Flagge?",e:"🇳🇱",a:["Niederlande","Frankreich","Italien"]},{q:"Zu welchem Land gehört die Flagge?",e:"🇬🇷",a:["Griechenland","Türkei","Spanien"]},
    {q:"Zu welchem Land gehört die Flagge?",e:"🇵🇱",a:["Polen","Deutschland","England"]},{q:"Zu welchem Land gehört die Flagge?",e:"🇺🇸",a:["USA","England","Frankreich"]}];
  var GEO_CONT=[{q:"Auf welchem Kontinent liegt Deutschland?",e:"🌍",a:["Europa","Afrika","Asien"]},{q:"Wo leben Pinguine?",e:"🐧",a:["Am Südpol","In der Wüste","Im Dschungel"]},
    {q:"Welcher ist der größte Ozean?",e:"🌊",a:["Pazifik","Nordsee","Bodensee"]},{q:"Wo leben Löwen in freier Natur?",e:"🦁",a:["In Afrika","Am Nordpol","In Europa"]}];
  var GEO_CAP=[{q:"Hauptstadt von Deutschland?",e:"🇩🇪",a:["Berlin","München","Hamburg"]},{q:"Hauptstadt von Frankreich?",e:"🇫🇷",a:["Paris","Lyon","Rom"]},{q:"Hauptstadt von Italien?",e:"🇮🇹",a:["Rom","Mailand","Madrid"]},{q:"Hauptstadt der Türkei?",e:"🇹🇷",a:["Ankara","Istanbul","Izmir"]},{q:"Hauptstadt von Spanien?",e:"🇪🇸",a:["Madrid","Barcelona","Paris"]}];
  var GEO_LVL={1:{title:"Flaggen",desc:"Länder erkennen",set:[qa(GEO_FLAG)]},2:{title:"Unsere Welt",desc:"Erde, Meer, Wüste …",set:[qa(GEO_WELT)]},
    3:{title:"Gemischt",desc:"Flaggen & Welt",set:[qa(GEO_FLAG),qa(GEO_WELT)]},
    4:{title:"Profi: mehr Länder & Kontinente",desc:"Flaggen, Ozeane, Kontinente",set:[qa(GEO_FLAG2),qa(GEO_CONT),qa(GEO_FLAG)]},
    5:{title:"Experte: Hauptstädte",desc:"Berlin, Paris, Ankara …",set:[qa(GEO_CAP),qa(GEO_FLAG2)]}};

  /* ---------- TÜRKISCH ---------- */
  var TR_COLORS=[{q:"„Rot“ auf Türkisch?",e:"🟥",a:["Kırmızı","Mavi","Sarı"]},{q:"„Blau“ auf Türkisch?",e:"🟦",a:["Mavi","Yeşil","Kırmızı"]},{q:"„Grün“ auf Türkisch?",e:"🟩",a:["Yeşil","Sarı","Mavi"]},{q:"„Gelb“ auf Türkisch?",e:"🟨",a:["Sarı","Kırmızı","Yeşil"]},{q:"„Schwarz“ auf Türkisch?",e:"⬛",a:["Siyah","Beyaz","Mavi"]},{q:"„Weiß“ auf Türkisch?",e:"⬜",a:["Beyaz","Siyah","Sarı"]}];
  var TR_ANIMALS=[{q:"„Hund“ auf Türkisch?",e:"🐶",a:["Köpek","Kedi","Kuş"]},{q:"„Katze“ auf Türkisch?",e:"🐱",a:["Kedi","Köpek","Balık"]},{q:"„Vogel“ auf Türkisch?",e:"🐦",a:["Kuş","At","İnek"]},{q:"„Fisch“ auf Türkisch?",e:"🐟",a:["Balık","Kedi","Kuş"]},{q:"„Pferd“ auf Türkisch?",e:"🐴",a:["At","İnek","Köpek"]},{q:"„Kuh“ auf Türkisch?",e:"🐮",a:["İnek","At","Kedi"]}];
  var TR_NUM=[{q:"„Eins“ auf Türkisch?",e:"1️⃣",a:["Bir","İki","Üç"]},{q:"„Zwei“ auf Türkisch?",e:"2️⃣",a:["İki","Bir","Dört"]},{q:"„Drei“ auf Türkisch?",e:"3️⃣",a:["Üç","İki","Beş"]},{q:"„Vier“ auf Türkisch?",e:"4️⃣",a:["Dört","Üç","Beş"]},{q:"„Fünf“ auf Türkisch?",e:"5️⃣",a:["Beş","Dört","Altı"]}];
  var TR_FAM=[{q:"„Mutter“ auf Türkisch?",e:"👩",a:["Anne","Baba","Abla"]},{q:"„Vater“ auf Türkisch?",e:"👨",a:["Baba","Anne","Dede"]},{q:"„Oma“ auf Türkisch?",e:"👵",a:["Nine","Dede","Abla"]},{q:"„Opa“ auf Türkisch?",e:"👴",a:["Dede","Nine","Baba"]}];
  var TR_FOOD=[{q:"„Brot“ auf Türkisch?",e:"🍞",a:["Ekmek","Su","Elma"]},{q:"„Wasser“ auf Türkisch?",e:"💧",a:["Su","Süt","Çay"]},{q:"„Apfel“ auf Türkisch?",e:"🍎",a:["Elma","Muz","Ekmek"]},{q:"„Milch“ auf Türkisch?",e:"🥛",a:["Süt","Su","Çay"]}];
  var TR_LVL={1:{title:"Farben (Renkler)",desc:"Kırmızı, Mavi …",set:[qa(TR_COLORS)]},2:{title:"Tiere (Hayvanlar)",desc:"Köpek, Kedi …",set:[qa(TR_ANIMALS)]},3:{title:"Zahlen (Sayılar)",desc:"Bir, İki …",set:[qa(TR_NUM)]},4:{title:"Alles gemischt",desc:"Farben, Tiere, Zahlen",set:[qa(TR_COLORS),qa(TR_ANIMALS),qa(TR_NUM)]},
    5:{title:"Experte: Familie & Essen",desc:"Anne, Baba, Ekmek …",set:[qa(TR_FAM),qa(TR_FOOD)]}};

  var GAMES={math:{title:"Rechnen",lvl:MATH_LVL,color:"var(--math)"},read:{title:"Lesen",lvl:READ_LVL,color:"var(--read)"},
    tr:{title:"Türkisch",lvl:TR_LVL,color:"#e30a17"},
    shape:{title:"Formen & Farben",lvl:SHAPE_LVL,color:"var(--shape)"},clock:{title:"Die Uhr",lvl:CLOCK_LVL,color:"var(--clock)"},
    english:{title:"Englisch",lvl:ENGLISH_LVL,color:"var(--accent-2)"},
    denken:{title:"Denken & Konzentration",lvl:DENK_LVL,color:"#00c2c2"},
    sach:{title:"Sachkunde",lvl:SACH_LVL,color:"#2bb673"},
    musik:{title:"Musik",lvl:MUSIK_LVL,color:"#ff7a3d"},
    geo:{title:"Geografie",lvl:GEO_LVL,color:"#2a9df4"}};
  var SUBJ=[{k:"math",e:"🔢",n:"Rechnen"},{k:"read",e:"🔤",n:"Lesen"},{k:"shape",e:"🔺",n:"Formen & Farben"},{k:"clock",e:"🕐",n:"Die Uhr"},{k:"english",e:"🇬🇧",n:"Englisch"},{k:"tr",e:"🇹🇷",n:"Türkisch"},{k:"denken",e:"🧠",n:"Denken"},{k:"sach",e:"🌍",n:"Sachkunde"},{k:"musik",e:"🎵",n:"Musik"},{k:"geo",e:"🗺️",n:"Geografie"}];

  var PRAISE=["Super!","Toll!","Richtig!","Klasse!","Bravo!","Stark!","Perfekt!","Juhu!"];
  var TRY=["Fast! Versuch es nochmal.","Nicht ganz – probier noch mal!","Schau nochmal genau hin."];

  /* ---------- Screens ---------- */
  var SCREENS=["profiles","newProfile","home","curriculum","focus","coach","levels","play","done","parent","games","ballons","blitz","memory","uno","schach","shop","vier","galgen","malen","badges","quiz","avatar","rmem","pyra","school","chest","pet","zeugnis"];
  function show(id){var fixedAdd=document.getElementById("profileAddFixed");if(fixedAdd)fixedAdd.style.display=(id==="profiles"?"block":"none");SCREENS.forEach(function(s){$("#"+s).hidden=(s!==id);});
    var hasActive=!!active(),pre=(id==="profiles"||id==="newProfile");
    $("#whoBtn").hidden=!hasActive||pre;
    $("#starPill").hidden=!hasActive||pre;
    $("#coinPill").hidden=!hasActive||pre;
    $("#parentBtn").hidden=!hasActive||pre||id==="parent";
    try{window.speechSynthesis.cancel();}catch(e){}
    try{var el=$("#"+id);if(el){el.classList.remove("screen-in");void el.offsetWidth;el.classList.add("screen-in");}}catch(e){}
  }

  /* ---------- Profile-UI ---------- */
  function renderProfiles(){
    var box=$("#profileList");if(!box)return;box.innerHTML="";
    if(!Array.isArray(profiles))profiles=[];
    profiles=profiles.filter(function(p){return p&&typeof p==="object";});
    var add=document.createElement("button");add.type="button";add.className="pcard add";add.setAttribute("aria-label","Neues Kinderprofil anlegen");
    add.style.cssText="position:relative;z-index:9999;pointer-events:auto;display:flex;width:100%;max-width:24rem;min-height:4.5rem;margin:0 auto 1rem;flex-direction:row;justify-content:center;background:var(--accent);color:white;border:0;touch-action:manipulation;cursor:pointer";
    add.innerHTML='<span class="av" style="background:transparent">＋</span><span class="pn">Kind anlegen</span>';
    add.addEventListener("click",function(ev){ev.preventDefault();ev.stopPropagation();openNewProfile();});
    add.addEventListener("touchend",function(ev){ev.preventDefault();openNewProfile();},{passive:false});
    box.appendChild(add);
    profiles.forEach(function(p){
      if(!p.stats)p.stats=blankStats();if(!p.stats.best)p.stats.best={};
      var b=document.createElement("button");b.type="button";b.className="pcard";b.style.cssText="position:relative;z-index:9999;pointer-events:auto;touch-action:manipulation;cursor:pointer";
      b.innerHTML='<span class="av">'+(p.av||"⭐")+'</span><span class="pn"></span><span class="ps">★ '+(p.stats.stars||0)+'</span>';
      b.querySelector(".pn").textContent=p.name||"Kind";
      b.addEventListener("click",function(ev){ev.preventDefault();ev.stopPropagation();activeId=p.id;persist();enterHome();});
      b.addEventListener("touchend",function(ev){ev.preventDefault();activeId=p.id;persist();enterHome();},{passive:false});
      box.appendChild(b);
    });
  }
  var pickedAv=AVATARS[0];
  function openNewProfile(){
    pickedAv=pick(AVATARS);$("#npName").value="";
    var ap=$("#avPick");ap.innerHTML="";
    AVATARS.forEach(function(a){var b=document.createElement("button");b.textContent=a;b.setAttribute("aria-pressed",a===pickedAv);
      b.addEventListener("click",function(){pickedAv=a;Array.prototype.forEach.call(ap.children,function(c){c.setAttribute("aria-pressed",c.textContent===a);});});ap.appendChild(b);});
    show("newProfile");
  }
  $("#npSave").addEventListener("click",function(){
    var name=($("#npName").value||"").trim()||"Kind";
    var p={id:Date.now(),name:name.slice(0,14),av:pickedAv,stats:blankStats()};
    profiles.push(p);activeId=p.id;persist();enterHome();
  });
  $("#npCancel").addEventListener("click",function(){ profiles.length?show("profiles"):openNewProfile(); });

  function enterHome(){
    var p=active();if(!p)return show("profiles");
    $("#homeHi").textContent="Hallo, "+p.name+"!";
    $("#whoAv").textContent=p.av;$("#whoName").textContent=p.name;
    $("#starCount").textContent=p.stats.stars;$("#coinCount").textContent=p.stats.coins||0;
    $("#homeSub").textContent=(p.stats.streak>=2?("🔥 "+p.stats.streak+" Tage in Folge – weiter so!"):"Was üben wir heute?");
    SUBJ.forEach(function(s){$("#best-"+s.k).textContent="★ "+(p.stats.best[s.k]||0);});
    Array.prototype.forEach.call(document.querySelectorAll("#homeTabs .tab"),function(x){x.classList.toggle("on",x.getAttribute("data-tab")==="learn");});
    $("#tab-learn").hidden=false;$("#tab-more").hidden=true;
    renderGoal();show("home");
  }

  /* ---------- Stufen-UI ---------- */
  var curGame=null,curLevel=1;
  function openLevels(key){
    if(key==="spiele")return openGames();
    curGame=key;var g=GAMES[key];
    $("#lvlTitle").textContent=g.title;
    var list=$("#lvlList");list.innerHTML="";
    Object.keys(g.lvl).forEach(function(n){
      var L=g.lvl[n];var b=document.createElement("button");b.className="lvl";
      b.innerHTML='<span class="num" style="background:'+g.color+'">'+n+'</span><span><span class="lt">'+L.title+'</span><br><span class="ld">'+L.desc+'</span></span><span class="chev">▶</span>';
      b.addEventListener("click",function(){curLevel=+n;startGame();});
      list.appendChild(b);
    });
    show("levels");
  }

  /* ---------- Spiel ---------- */
  var state=null;
  function startGame(){
    state={key:curGame,level:curLevel,round:0,correct:0,current:null,tries:0,earned:0,streak:0};
    $("#streak").hidden=true;show("play");nextRound();
  }
  function nextRound(){
    if(state.round>=ROUNDS)return finish();
    state.round++;state.tries=0;drawMascot("idle");
    var set=GAMES[state.key].lvl[state.level].set;
    state.current=pick(set)();
    var q=state.current;
    $("#qlabel").textContent=q.label;$("#roundLbl").textContent=state.round+"/"+ROUNDS;
    $("#progBar").style.width=((state.round-1)/ROUNDS*100)+"%";
    q.render($("#qzone"));
    $("#feedback").textContent="";$("#feedback").className="feedback";
    buildAnswers(q);
    if(q.speakLang)setTimeout(function(){speak(q.speak,q.speakLang);},250); // englisches Wort vorlesen
  }
  function buildAnswers(q){
    var box=$("#answers");box.innerHTML="";box.className="answers"+(q.three?" three":"");
    q.options.forEach(function(opt){var b=document.createElement("button");b.className="opt";
      if(q.word)b.innerHTML='<span class="word">'+opt+'</span>';else b.textContent=opt;
      b.setAttribute("aria-label",opt);b.addEventListener("click",function(){choose(b,opt,q);});box.appendChild(b);});
  }
  function flyStar(x,y){var s=document.createElement("div");s.className="flystar";s.textContent="★";s.style.left=(x-15)+"px";s.style.top=(y-15)+"px";document.body.appendChild(s);setTimeout(function(){s.remove();},1000);}
  function confetti(){
    try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;}catch(e){}
    var c=document.getElementById("confetti");
    if(!c){c=document.createElement("canvas");c.id="confetti";document.body.appendChild(c);}
    var ctx=c.getContext("2d"),W=c.width=innerWidth,H=c.height=innerHeight;
    var cols=["#ff6b6b","#2aa7ff","#19b36b","#ffc02e","#b07bff","#ff8a3d"],P=[];
    for(var i=0;i<130;i++)P.push({x:Math.random()*W,y:-20-Math.random()*H*.3,r:4+Math.random()*5,c:cols[i%cols.length],vy:2+Math.random()*3.5,vx:-1.2+Math.random()*2.4,rot:Math.random()*6,vr:-.2+Math.random()*.4});
    var t0=Date.now();
    (function frame(){var el=Date.now()-t0;ctx.clearRect(0,0,W,H);
      P.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});
      if(el<2400)requestAnimationFrame(frame);else ctx.clearRect(0,0,W,H);})();
  }
  function choose(btn,opt,q){
    if(btn.disabled)return;var p=active();
    if(opt===q.correct){
      btn.classList.add("good");drawMascot("happy");sCorrect();
      var ms=$("#mascot");ms.classList.remove("bounce");void ms.offsetWidth;ms.classList.add("bounce");
      Array.prototype.forEach.call($("#answers").children,function(c){c.disabled=true;});
      $("#feedback").className="feedback ok";$("#feedback").innerHTML="⭐ "+pick(PRAISE);
      state.correct++;p.stats.correct++;
      state.streak++;if(state.streak>=2){$("#streakN").textContent=state.streak;$("#streak").hidden=false;}
      if(state.tries===0){p.stats.stars++;state.earned++;sStar();var r=btn.getBoundingClientRect();flyStar(r.left+r.width/2,r.top);$("#starCount").textContent=p.stats.stars;}
      persist();speak(pick(PRAISE));
      $("#progBar").style.width=(state.round/ROUNDS*100)+"%";
      setTimeout(nextRound,900);
    } else {
      state.tries++;btn.classList.add("bad");btn.disabled=true;drawMascot("sad");sWrong();
      state.streak=0;$("#streak").hidden=true;
      $("#feedback").className="feedback try";$("#feedback").textContent=pick(TRY);
      if(state.tries>=2){Array.prototype.forEach.call($("#answers").children,function(c){c.disabled=true;if(c.getAttribute("aria-label")===q.correct)c.classList.add("good");});
        $("#feedback").innerHTML="Die Lösung ist <b>"+q.correct+"</b>";setTimeout(nextRound,1600);}
    }
  }
  function finish(){
    var p=active();p.stats.rounds++;
    if(state.earned>p.stats.best[state.key])p.stats.best[state.key]=state.earned;
    p.stats.coins=(p.stats.coins||0)+state.correct; // 1 Münze je richtige Antwort
    bumpStreak(p);
    var dk=dayKey();if(!p.stats.history)p.stats.history={};var h=p.stats.history[dk]||{rounds:0,correct:0,stars:0};
    h.rounds++;h.correct+=state.correct;h.stars+=state.earned;p.stats.history[dk]=h;
    persist();
    $("#starCount").textContent=p.stats.stars;$("#coinCount").textContent=p.stats.coins;
    var got=state.correct;
    $("#doneStars").textContent=got>=9?"★★★":got>=6?"★★":got>=1?"★":"☆";
    $("#doneEmoji").textContent=got>=9?"🏆":got>=6?"🎉":"🌟";
    $("#doneTitle").textContent=got>=9?"Fantastisch!":got>=6?"Super gemacht!":"Gut geübt!";
    $("#doneText").textContent="Du hast "+got+" von "+ROUNDS+" richtig – "+state.earned+" Sterne und "+state.correct+" Münzen 🪙 verdient.";
    if(SCHOOL.on){var last=SCHOOL.idx>=SCHOOL.lessons.length-1;
      SCHOOL.results[SCHOOL.idx]={name:SCHOOL.lessons[SCHOOL.idx].name,emoji:SCHOOL.lessons[SCHOOL.idx].emoji,earned:state.earned};
      $("#doneTitle").textContent=last?"Lernzeit geschafft! 🎓":"Stunde "+(SCHOOL.idx+1)+" geschafft!";
      if(last)$("#doneEmoji").textContent="🎓";
      $("#againBtn").textContent=last?"Zeugnis ansehen 🎓":"🔔 Nächste Stunde →";
      $("#homeBtn").style.display=last?"none":"";$("#homeBtn").textContent="Lernzeit abbrechen";
    } else {$("#againBtn").textContent="Nochmal";$("#homeBtn").style.display="";$("#homeBtn").textContent="Zur Startseite";}
    show("done");if(got>=6||SCHOOL.on)confetti();speak($("#doneTitle").textContent);
  }

  /* ---------- Eltern-Bereich ---------- */
  var gateA=0,gateB=0;
  function openParent(){
    gateA=3+rnd(6);gateB=3+rnd(6);
    $("#gateQ").textContent="Zum Schutz: Was ist "+gateA+" × "+gateB+"?";
    $("#gateInput").value="";$("#gateFb").textContent="";
    $("#gate").hidden=false;$("#parentBody").hidden=true;show("parent");
  }
  $("#gateGo").addEventListener("click",function(){
    if(parseInt($("#gateInput").value,10)===gateA*gateB){ $("#gate").hidden=true;$("#parentBody").hidden=false;renderParent(); }
    else { $("#gateFb").textContent="Leider falsch. Versuch es nochmal."; }
  });
  $("#gateInput").addEventListener("keydown",function(e){if(e.key==="Enter")$("#gateGo").click();});
  function renderParent(){
    renderCurriculumProgress();
    var p=active();if(!p)return;
    $("#parentWho").textContent="Fortschritt von "+p.name;
    $("#pStars").textContent=p.stats.stars;$("#pRounds").textContent=p.stats.rounds;$("#pCorrect").textContent=p.stats.correct;
    focusStats(p);$("#pFocusSessions").textContent=p.stats.focusSessions;$("#pFocusMinutes").textContent=p.stats.focusMinutes;$("#pFocusLevel").textContent=p.stats.focusLevel;
    // 7-Tage-Diagramm (Sterne pro Tag)
    var days=[],d0=new Date(),LBL=["So","Mo","Di","Mi","Do","Fr","Sa"];
    for(var di=6;di>=0;di--){var x=new Date(d0);x.setDate(d0.getDate()-di);days.push({k:dayKey(x),l:LBL[x.getDay()]});}
    var hist=p.stats.history||{},maxv=1,vals=days.map(function(w){var v=(hist[w.k]||{}).stars||0;if(v>maxv)maxv=v;return v;});
    var W=320,H=110,pad=20,bw=28,gap=(W-pad*2-bw*7)/6,svg='<svg viewBox="0 0 '+W+' '+(H+26)+'" style="width:100%;height:auto" role="img" aria-label="Sterne der letzten sieben Tage">';
    days.forEach(function(w,i){var v=vals[i],bh=Math.round(v/maxv*H),bx=pad+i*(bw+gap),by=pad+H-bh;
      svg+='<rect x="'+bx+'" y="'+pad+'" width="'+bw+'" height="'+H+'" rx="5" fill="var(--line)"/>';
      svg+='<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" rx="5" fill="var(--accent)"/>';
      if(v>0)svg+='<text x="'+(bx+bw/2)+'" y="'+(by-4)+'" font-size="11" font-family="Fredoka,sans-serif" fill="var(--ink)" text-anchor="middle">'+v+'</text>';
      svg+='<text x="'+(bx+bw/2)+'" y="'+(pad+H+17)+'" font-size="11" font-family="Nunito,sans-serif" fill="var(--ink-soft)" text-anchor="middle">'+w.l+'</text>';});
    svg+='</svg>';$("#pChart").innerHTML=svg;
    var total7=vals.reduce(function(a,b){return a+b;},0);
    $("#pChartNote").textContent=total7>0?("In den letzten 7 Tagen "+total7+" Sterne gesammelt."):"Diese Woche wurde noch nicht geübt.";
    var box=$("#pSubjects");box.innerHTML="";var maxStars=0;
    SUBJ.forEach(function(s){if(p.stats.best[s.k]>maxStars)maxStars=p.stats.best[s.k];});
    var weakest=SUBJ[0];
    SUBJ.forEach(function(s){
      if(p.stats.best[s.k]<p.stats.best[weakest.k])weakest=s;
      var pct=Math.round(p.stats.best[s.k]/10*100);
      var row=document.createElement("div");row.className="statrow";
      row.innerHTML='<div class="ic" style="background:'+GAMES[s.k].color+'">'+s.e+'</div><div style="flex:1"><div class="nm">'+s.n+'</div><div class="barmini"><i style="width:'+pct+'%"></i></div></div><div class="val">'+p.stats.best[s.k]+'/10</div>';
      box.appendChild(row);
    });
    var tip;
    if(p.stats.rounds===0) tip="Noch nichts geübt. Fangt gemeinsam mit Rechnen, Stufe 1 (Mengen und Zehnerfeld) an. 5 Minuten am Tag reichen.";
    else if(p.stats.best[weakest.k]<5) tip="Das Fach "+weakest.n+" fällt noch schwer. Übt es in der leichtesten Stufe, täglich kurz und mit viel Lob.";
    else tip="Schöner Fortschritt! Steigert euch beim stärksten Fach eine Stufe und bleibt beim schwächsten geduldig.";
    $("#pTip").textContent=tip;
    var goal=p.stats.goal||10;$("#goalText").textContent="Aktuell: "+goal+" Sterne pro Tag. Heute schon "+((p.stats.history&&p.stats.history[dayKey()]||{}).stars||0)+" geschafft.";
    Array.prototype.forEach.call(document.querySelectorAll("#goalPick button"),function(x){x.setAttribute("aria-pressed",(+x.getAttribute("data-g"))===goal);});
    populateVoices();
  }
  $("#pReset").addEventListener("click",function(){
    var p=active();if(!p)return;
    if($("#pReset").dataset.armed){ p.stats=blankStats();persist();renderParent();enterHomeStarPill();$("#pReset").textContent="Fortschritt dieses Kindes zurücksetzen";delete $("#pReset").dataset.armed; }
    else { $("#pReset").textContent="Wirklich? Nochmal tippen zum Bestätigen";$("#pReset").dataset.armed="1"; }
  });
  function enterHomeStarPill(){var p=active();if(p)$("#starCount").textContent=p.stats.stars;}
  $("#pSwitch").addEventListener("click",function(){activeId=null;persist();renderProfiles();show("profiles");});
  Array.prototype.forEach.call(document.querySelectorAll("#goalPick button"),function(btn){btn.addEventListener("click",function(){var p=active();if(!p)return;p.stats.goal=+btn.getAttribute("data-g");persist();renderParent();});});
  (function(){var vsel=$("#voicePick");if(vsel)vsel.addEventListener("change",function(){save("antona_voice",vsel.value);chooseVoice();});
    var vt=$("#voiceTest");if(vt)vt.addEventListener("click",function(){speak("Hallo! Ich lese dir die Aufgaben vor.");});})();

  /* ---------- Daten sichern & übertragen (Sync ohne Konto) ---------- */
  function migrateProfiles(){
    profiles.forEach(function(p){if(!p.stats)p.stats=blankStats();if(!p.stats.best||typeof p.stats.best!=="object"||Array.isArray(p.stats.best))p.stats.best={};if(!p.stats.history||typeof p.stats.history!=="object"||Array.isArray(p.stats.history))p.stats.history={};
      if(p.stats.coins===undefined)p.stats.coins=0;if(p.stats.ballonBest===undefined)p.stats.ballonBest=0;if(p.stats.blitzBest===undefined)p.stats.blitzBest=0;
      if(p.stats.streak===undefined)p.stats.streak=0;if(p.stats.lastDay===undefined)p.stats.lastDay="";if(p.stats.badges===undefined)p.stats.badges={};
    if(p.stats.quizBest===undefined)p.stats.quizBest=0;if(p.stats.goal===undefined)p.stats.goal=10;if(!p.stats.unlocked)p.stats.unlocked=[];
    if(p.stats.lastChest===undefined)p.stats.lastChest="";
    ["math","read","shape","clock","english","tr","denken","sach","musik","geo"].forEach(function(k){if(p.stats.best[k]===undefined)p.stats.best[k]=0;});});
  }
  $("#syncShow").addEventListener("click",function(){
    try{var code=LernsterneStorage.encodeBackup(profiles);
      $("#syncOut").value=code;$("#syncOutWrap").hidden=false;$("#syncCopyMsg").textContent="";}
    catch(e){$("#syncCopyMsg").textContent="Konnte keinen Code erstellen.";}
  });
  $("#syncCopy").addEventListener("click",function(){
    var t=$("#syncOut");try{t.focus();t.select();}catch(e){}
    function ok(){$("#syncCopyMsg").textContent=" Kopiert!";}
    function manual(){$("#syncCopyMsg").textContent=" Bitte markieren und kopieren.";}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(ok,function(){try{document.execCommand("copy")?ok():manual();}catch(e){manual();}});}
    else{try{document.execCommand("copy")?ok():manual();}catch(e){manual();}}
  });
  $("#syncImport").addEventListener("click",function(){
    var v=($("#syncIn").value||"").trim(),msg=$("#syncMsg");
    if(!v){msg.className="feedback try";msg.textContent="Bitte zuerst einen Code einfügen.";return;}
    var oldProfiles=profiles,oldActiveId=activeId;
    try{var arr=LernsterneStorage.decodeBackup(v);
      if(!arr.length)throw new Error("Keine Profile im Code.");
      profiles=arr;migrateProfiles();activeId=profiles[0].id;
      if(!persist()){profiles=oldProfiles;activeId=oldActiveId;throw new Error("Speichern fehlgeschlagen.");}
      msg.className="feedback ok";msg.textContent="✓ Übernommen! "+profiles.length+" Profil(e) geladen.";
      renderProfiles();
    }catch(e){msg.className="feedback try";msg.textContent="Der Code ist ungültig oder konnte nicht gespeichert werden. Deine bisherigen Profile wurden nicht ersetzt.";}
  });

  /* ---------- SPIELE (Anton-Prinzip: Münzen verdienen & verspielen) ---------- */
  var GAME_LIST=[
    {id:"ballons",name:"Zahlen-Ballons",emoji:"🎈",cost:5,desc:"Platze den Ballon mit dem richtigen Ergebnis."},
    {id:"blitz",name:"Blitz-Rechnen",emoji:"⚡",cost:4,desc:"So viele Aufgaben wie möglich in 30 Sekunden."},
    {id:"memory",name:"Sternen-Memory",emoji:"🧠",cost:5,desc:"Finde die passenden Paare."},
    {id:"uno",name:"UNO (Kinder)",emoji:"🎴",cost:6,desc:"Karten gegen den Computer: Farbe oder Zahl passend legen."},
    {id:"schach",name:"Schach (Kinder)",emoji:"♟️",cost:6,desc:"Schlage den König des Computers."},
    {id:"shop",name:"Kaufladen & Kasse",emoji:"🛒",cost:0,desc:"Live gegen den Computer kassieren: Preis, Rückgeld, bar oder Karte."},
    {id:"vier",name:"Vier gewinnt",emoji:"🔴",cost:5,desc:"Bringe vier Steine in eine Reihe – gegen den Computer."},
    {id:"galgen",name:"Galgenmännchen",emoji:"🔤",cost:4,desc:"Errate das Wort Buchstabe für Buchstabe."},
    {id:"malen",name:"Malen & Kritzeln",emoji:"🎨",cost:0,desc:"Frei malen mit vielen Farben."},
    {id:"quiz",name:"Quiz-Duell auf Zeit",emoji:"🦉",cost:4,desc:"So viele Wissensfragen wie möglich in 30 Sekunden."},
    {id:"rmem",name:"Rechen-Memory",emoji:"🧮",cost:5,desc:"Aufgabe und Ergebnis als Paar finden (3+4 und 7)."},
    {id:"pyra",name:"Zahlen-Pyramide",emoji:"🔺",cost:0,desc:"Finde den fehlenden Stein – jeder Stein = die zwei darunter."}
  ];
  function openGames(){
    var p=active();if(!p)return;
    $("#gamesCoins").textContent=p.stats.coins||0;
    var list=$("#gamesList");list.innerHTML="";
    GAME_LIST.forEach(function(g){
      var canPlay=(p.stats.coins||0)>=g.cost;
      var b=document.createElement("button");b.className="lvl";b.disabled=!canPlay;if(!canPlay)b.style.opacity=".55";
      var rec=g.id==="ballons"?(p.stats.ballonBest||0):g.id==="blitz"?(p.stats.blitzBest||0):0;
      b.innerHTML='<span class="num" style="background:var(--accent-2)">'+g.emoji+'</span>'
        +'<span><span class="lt">'+g.name+'</span><br><span class="ld">'+g.desc+(rec?' · Rekord '+rec:'')+'</span></span>'
        +'<span class="chev">'+(g.cost>0?'🪙 '+g.cost:'Gratis')+'</span>';
      b.addEventListener("click",function(){if(!canPlay)return;p.stats.coins-=g.cost;persist();$("#coinCount").textContent=p.stats.coins;
        if(g.id==="ballons")startBallon();else if(g.id==="blitz")startBlitz();else if(g.id==="memory")startMemory();
        else if(g.id==="uno")startUno();else if(g.id==="schach")startChess();else if(g.id==="shop")startShop();
        else if(g.id==="vier")startVier();else if(g.id==="galgen")startGalgen();else if(g.id==="malen")startMalen();
        else if(g.id==="quiz")startQuiz();else if(g.id==="rmem")startRmem();else if(g.id==="pyra")startPyra();});
      list.appendChild(b);
    });
    var note=document.createElement("p");note.className="muted";note.style.marginTop=".7rem";
    note.textContent=(p.stats.coins||0)<GAME_LIST[0].cost?"Übe ein paar Aufgaben, um Münzen zu verdienen – jede richtige Antwort gibt eine Münze 🪙.":"Viel Spaß! Neue Münzen verdienst du beim Üben.";
    list.appendChild(note);
    show("games");
  }
  /* Zahlen-Ballons */
  var BG={on:false,score:0,time:60,balloons:[],raf:0,timer:0,area:null,answer:0},BCOL=["#ff6b6b","#2aa7ff","#19b36b","#b07bff","#ff8a3d","#ff5d9e"],spawnScheduled=false;
  function ballonQuestion(){var plus=Math.random()<0.6,a,b,res;
    if(plus){a=2+rnd(16);b=2+rnd(18-a>0?18-a:1);res=a+b;$("#ballonQ").textContent=a+" + "+b+" = ?";}
    else{a=5+rnd(15);b=1+rnd(a-1);res=a-b;$("#ballonQ").textContent=a+" − "+b+" = ?";}
    BG.answer=res;}
  function clearBalloons(){BG.balloons.forEach(function(bo){if(bo.el&&bo.el.parentNode)bo.el.parentNode.removeChild(bo.el);});BG.balloons=[];}
  function spawnWave(){
    if(!BG.on)return;clearBalloons();ballonQuestion();
    var area=BG.area,W=area.clientWidth||300,H=area.clientHeight||320;
    var opts=uniq(BG.answer,function(){var d=BG.answer+(rnd(9)-4);return d<0?BG.answer+1+rnd(4):d;},3),slot=W/opts.length;
    opts.forEach(function(val,i){
      var el=document.createElement("div");el.className="balloon";el.textContent=val;el.style.background=BCOL[(i+rnd(6))%BCOL.length];
      var x=slot*i+slot/2-28+(-8+rnd(16));if(x<4)x=4;if(x>W-60)x=W-60;
      var bo={el:el,x:x,y:H+rnd(50),speed:1.4+Math.random()*1.1+BG.score*0.05,val:val,correct:val===BG.answer,done:false};
      el.style.transform="translate("+bo.x+"px,"+bo.y+"px)";
      el.addEventListener("click",function(){tapBalloon(bo);});
      area.appendChild(el);BG.balloons.push(bo);
    });
  }
  function spawnSoon(){if(spawnScheduled)return;spawnScheduled=true;setTimeout(function(){spawnScheduled=false;if(BG.on)spawnWave();},280);}
  function tapBalloon(bo){
    if(!BG.on||bo.done)return;bo.done=true;bo.el.classList.add("pop");
    if(bo.correct){BG.score++;$("#ballonScore").textContent=BG.score;sStar();spawnSoon();}
    else{sWrong();setTimeout(function(){if(bo.el.parentNode)bo.el.parentNode.removeChild(bo.el);},250);}
  }
  function ballonLoop(){
    if(!BG.on)return;
    BG.balloons.forEach(function(bo){if(bo.done)return;bo.y-=bo.speed;bo.el.style.transform="translate("+bo.x+"px,"+bo.y+"px)";});
    var aliveCorrect=BG.balloons.some(function(bo){return bo.correct&&!bo.done&&bo.y>-70;});
    if(!aliveCorrect)spawnSoon();
    BG.raf=requestAnimationFrame(ballonLoop);
  }
  function startBallon(){
    BG.on=true;BG.score=0;BG.time=60;$("#ballonScore").textContent="0";$("#ballonTime").textContent="60";
    show("ballons");BG.area=$("#ballonArea");BG.area.innerHTML="";
    spawnWave();BG.raf=requestAnimationFrame(ballonLoop);
    BG.timer=setInterval(function(){BG.time--;$("#ballonTime").textContent=BG.time;if(BG.time<=0)endBallon();},1000);
  }
  function stopBallon(){BG.on=false;cancelAnimationFrame(BG.raf);clearInterval(BG.timer);clearBalloons();}
  function endBallon(){
    stopBallon();var p=active();if(p){if(BG.score>(p.stats.ballonBest||0))p.stats.ballonBest=BG.score;persist();}
    confetti();
    $("#ballonArea").innerHTML='<div class="gresult"><div style="font-size:3rem">🎈</div>'
      +'<h2 class="display" style="margin:0;font-size:1.6rem">'+BG.score+' Ballons geschafft!</h2>'
      +'<p class="muted" style="margin:0">Rekord: '+((p&&p.stats.ballonBest)||BG.score)+'</p>'
      +'<button class="next" id="ballonAgain">Nochmal (🪙 5)</button></div>';
    var again=$("#ballonAgain");if(again)again.addEventListener("click",function(){
      if(!p||(p.stats.coins||0)<5){openGames();return;}p.stats.coins-=5;persist();$("#coinCount").textContent=p.stats.coins;startBallon();});
  }

  /* Blitz-Rechnen */
  var BLITZ={on:false,score:0,time:30,timer:0};
  function startBlitz(){BLITZ={on:true,score:0,time:30,timer:0};$("#blitzScore").textContent="0";$("#blitzTime").textContent="30";
    show("blitz");blitzNext();BLITZ.timer=setInterval(function(){BLITZ.time--;$("#blitzTime").textContent=BLITZ.time;if(BLITZ.time<=0)endBlitz();},1000);}
  function blitzNext(){var plus=Math.random()<0.6,a,b,res;
    if(plus){a=2+rnd(16);b=2+rnd(18-a>0?18-a:1);res=a+b;$("#blitzQ").textContent=a+" + "+b+" = ?";}
    else{a=5+rnd(14);b=1+rnd(a-1);res=a-b;$("#blitzQ").textContent=a+" − "+b+" = ?";}
    var opts=uniq(res,function(){var d=res+(rnd(7)-3);return d<0?res+1+rnd(3):d;},3),box=$("#blitzAns");box.innerHTML="";$("#blitzFb").textContent="";$("#blitzFb").className="feedback";
    opts.forEach(function(v){var btn=document.createElement("button");btn.className="opt";btn.textContent=v;btn.addEventListener("click",function(){blitzAnswer(v===res,btn);});box.appendChild(btn);});}
  function blitzAnswer(ok,btn){if(!BLITZ.on)return;if(ok){BLITZ.score++;$("#blitzScore").textContent=BLITZ.score;sCorrect();blitzNext();}else{sWrong();btn.classList.add("bad");btn.disabled=true;}}
  function stopBlitz(){BLITZ.on=false;clearInterval(BLITZ.timer);}
  function endBlitz(){stopBlitz();confetti();var p=active();if(p&&BLITZ.score>(p.stats.blitzBest||0)){p.stats.blitzBest=BLITZ.score;persist();}
    $("#blitzQ").textContent="Fertig! ⚡";$("#blitzAns").innerHTML="";$("#blitzFb").className="feedback ok";
    $("#blitzFb").innerHTML=BLITZ.score+" richtig! &nbsp;<button class=\"next\" id=\"blitzAgain\">Nochmal (🪙 4)</button>";
    var again=$("#blitzAgain");if(again)again.addEventListener("click",function(){if(!p||(p.stats.coins||0)<4){openGames();return;}p.stats.coins-=4;persist();$("#coinCount").textContent=p.stats.coins;startBlitz();});}

  /* Sternen-Memory */
  var MEM={on:false,first:null,lock:false,moves:0,pairs:0,total:6},MEMSYM=["🍎","🐶","⭐","🚗","🌸","🐱","🦊","🎈","🍌","⚽","🐭","🌈"];
  function startMemory(){MEM={on:true,first:null,lock:false,moves:0,pairs:0,total:6};$("#memMoves").textContent="0";$("#memPairs").textContent="0";
    var syms=shuffle(MEMSYM).slice(0,MEM.total),deck=shuffle(syms.concat(syms)),g=$("#memGrid");g.innerHTML="";
    deck.forEach(function(s){var c=document.createElement("div");c.className="mcard";c.setAttribute("data-sym",s);c.textContent="★";
      c.addEventListener("click",function(){flipCard(c);});g.appendChild(c);});show("memory");}
  function flipCard(c){if(!MEM.on||MEM.lock||c.classList.contains("open")||c.classList.contains("done"))return;
    c.classList.add("open");c.textContent=c.getAttribute("data-sym");
    if(!MEM.first){MEM.first=c;return;}
    MEM.moves++;$("#memMoves").textContent=MEM.moves;
    if(MEM.first.getAttribute("data-sym")===c.getAttribute("data-sym")){
      MEM.first.classList.add("done");c.classList.add("done");MEM.first=null;MEM.pairs++;$("#memPairs").textContent=MEM.pairs;sStar();
      if(MEM.pairs>=MEM.total)endMemory();
    } else {MEM.lock=true;var a=MEM.first,bc=c;MEM.first=null;sWrong();
      setTimeout(function(){a.classList.remove("open");a.textContent="★";bc.classList.remove("open");bc.textContent="★";MEM.lock=false;},750);}}
  function endMemory(){MEM.on=false;confetti();var p=active();
    $("#memGrid").innerHTML='<div class="gresult" style="grid-column:1/-1"><div style="font-size:3rem">🧠</div><h2 class="display" style="margin:0;font-size:1.5rem">Alle Paare gefunden!</h2><p class="muted" style="margin:0">'+MEM.moves+' Versuche</p><button class="next" id="memAgain">Nochmal (🪙 5)</button></div>';
    var again=$("#memAgain");if(again)again.addEventListener("click",function(){if(!p||(p.stats.coins||0)<5){openGames();return;}p.stats.coins-=5;persist();$("#coinCount").textContent=p.stats.coins;startMemory();});}

  /* ---------- UNO (Kinder, gegen den Computer) ---------- */
  var UNO=null,UC=["R","Y","G","B"];
  function unoBuild(){var d=[];UC.forEach(function(c){d.push({c:c,v:"0"});
    for(var n=1;n<=9;n++){d.push({c:c,v:""+n});d.push({c:c,v:""+n});}
    for(var k=0;k<2;k++){d.push({c:c,v:"S"});d.push({c:c,v:"D"});}});
    for(var w=0;w<4;w++){d.push({c:"W",v:"W"});d.push({c:"W",v:"F"});}return shuffle(d);}
  function unoLabel(card){return card.v==="S"?"⊘":card.v==="D"?"+2":card.v==="W"?"🎨":card.v==="F"?"+4":card.v;}
  function unoTop(){return UNO.discard[UNO.discard.length-1];}
  function unoPlayable(card){var t=unoTop();return card.c==="W"||card.c===UNO.color||(t.c!=="W"&&card.v===t.v);}
  function unoReshuffle(){if(UNO.deck.length<=0){var top=UNO.discard.pop();UNO.deck=shuffle(UNO.discard);UNO.discard=[top];}}
  function unoDrawN(hand,n){for(var i=0;i<n;i++){unoReshuffle();if(UNO.deck.length)hand.push(UNO.deck.shift());}}
  function startUno(){var deck=unoBuild(),player=deck.splice(0,7),cpu=deck.splice(0,7),first;
    do{first=deck.shift();if(first.c==="W")deck.push(first);}while(first.c==="W");
    UNO={deck:deck,discard:[first],player:player,cpu:cpu,turn:"p",color:first.c,over:false,pendingWild:null};
    $("#unoColorPick").hidden=true;$("#unoInfo").textContent="Du bist dran.";show("uno");renderUno();}
  function unoInner(lab){return '<span class="uc-oval"></span><span class="uc-corner tl">'+lab+'</span><span class="uc-big">'+lab+'</span><span class="uc-corner br">'+lab+'</span>';}
  function renderUno(){var t=unoTop(),dc=$("#unoDiscard");dc.className="unocard big "+(UNO.color==="W"?"W":UNO.color);dc.innerHTML=unoInner(unoLabel(t));
    $("#unoCpu").textContent=UNO.cpu.length;var hand=$("#unoHand");hand.innerHTML="";
    UNO.player.forEach(function(card){var el=document.createElement("div");el.className="unocard "+(card.c==="W"?"W":card.c)+(UNO.turn==="p"&&!UNO.over&&unoPlayable(card)?" playable":"");
      el.innerHTML=unoInner(unoLabel(card));el.addEventListener("click",function(){playerPlayUno(card);});hand.appendChild(el);});}
  function playerPlayUno(card){if(UNO.over||UNO.turn!=="p"||UNO.pendingWild||!unoPlayable(card))return;
    var i=UNO.player.indexOf(card);if(i<0)return;UNO.player.splice(i,1);UNO.discard.push(card);sCorrect();
    if(UNO.player.length===1)toast("UNO! 🎴");
    if(card.c==="W"){UNO.pendingWild=card;$("#unoColorPick").hidden=false;$("#unoInfo").textContent="Wähle eine Wunschfarbe.";renderUno();return;}
    UNO.color=card.c;applyUnoEffect(card.v,"p");}
  function unoChooseColor(c){if(!UNO.pendingWild)return;var card=UNO.pendingWild;UNO.pendingWild=null;UNO.color=c;$("#unoColorPick").hidden=true;applyUnoEffect(card.v,"p");}
  function applyUnoEffect(v,who){
    if(who==="p"&&UNO.player.length===0)return unoWin("p");
    if(who==="c"&&UNO.cpu.length===0)return unoWin("c");
    var opp=who==="p"?UNO.cpu:UNO.player,skip=false;
    if(v==="D"){unoDrawN(opp,2);skip=true;}else if(v==="F"){unoDrawN(opp,4);skip=true;}else if(v==="S"){skip=true;}
    renderUno();
    if(who==="p"){if(skip){UNO.turn="p";$("#unoInfo").textContent="Computer setzt aus – du bist nochmal dran.";renderUno();}
      else{UNO.turn="c";$("#unoInfo").textContent="Computer ist dran …";setTimeout(cpuUno,850);}}
    else{if(skip){UNO.turn="c";setTimeout(cpuUno,850);}else{UNO.turn="p";$("#unoInfo").textContent="Du bist dran.";renderUno();}}}
  function cpuUno(){if(UNO.over)return;var choices=UNO.cpu.filter(unoPlayable);
    if(choices.length===0){unoDrawN(UNO.cpu,1);renderUno();choices=UNO.cpu.filter(unoPlayable);
      if(choices.length===0){UNO.turn="p";$("#unoInfo").textContent="Computer zieht. Du bist dran.";renderUno();return;}}
    var card=choices.filter(function(x){return x.c!=="W";})[0]||choices[0];
    UNO.cpu.splice(UNO.cpu.indexOf(card),1);UNO.discard.push(card);sCorrect();
    if(UNO.cpu.length===1)toast("Computer hat UNO!");
    if(card.c==="W"){var cnt={R:0,Y:0,G:0,B:0};UNO.cpu.forEach(function(x){if(cnt[x.c]!==undefined)cnt[x.c]++;});var best="R";UC.forEach(function(c){if(cnt[c]>cnt[best])best=c;});UNO.color=best;}
    else UNO.color=card.c;
    $("#unoInfo").textContent="Computer legt "+unoLabel(card)+(card.c==="W"?" (Farbe "+({R:"Rot",Y:"Gelb",G:"Grün",B:"Blau"}[UNO.color])+")":"")+".";
    applyUnoEffect(card.v,"c");}
  function unoWin(who){UNO.over=true;$("#unoColorPick").hidden=true;if(who==="p"){confetti();sStar();}
    $("#unoInfo").innerHTML=(who==="p"?"🎉 Du hast gewonnen!":"Der Computer hat gewonnen.")+' &nbsp;<button class="next" id="unoAgain">Nochmal (🪙 6)</button>';
    renderUno();var p=active(),again=$("#unoAgain");if(again)again.addEventListener("click",function(){if(!p||(p.stats.coins||0)<6){openGames();return;}p.stats.coins-=6;persist();$("#coinCount").textContent=p.stats.coins;startUno();});}

  /* ---------- SCHACH (Kinder: König schlagen) ---------- */
  var CH=null,chLevel=2,PIECE={w:{p:"♙",n:"♘",b:"♗",r:"♖",q:"♕",k:"♔"},b:{p:"♟",n:"♞",b:"♝",r:"♜",q:"♛",k:"♚"}};
  function inb(r,c){return r>=0&&r<8&&c>=0&&c<8;}
  function startChess(){var b=[];for(var i=0;i<8;i++)b.push([null,null,null,null,null,null,null,null]);
    var back=["r","n","b","q","k","b","n","r"];
    for(var c=0;c<8;c++){b[0][c]={t:back[c],w:false};b[1][c]={t:"p",w:false};b[6][c]={t:"p",w:true};b[7][c]={t:back[c],w:true};}
    CH={board:b,turn:"w",sel:null,over:false};$("#schMsg").textContent="Schlage den König 👑 des Computers!";$("#schTurn").textContent="Du bist dran";
    Array.prototype.forEach.call(document.querySelectorAll("#schDiff button"),function(x){x.setAttribute("aria-pressed",(+x.getAttribute("data-lv"))===chLevel);});
    show("schach");renderChess();}
  function underThreat(tr,tc){for(var r=0;r<8;r++)for(var c=0;c<8;c++){var p=CH.board[r][c];if(p&&p.w&&chMoves(r,c).some(function(m){return m[0]===tr&&m[1]===tc;}))return true;}return false;}
  function chMoves(r,c){var b=CH.board,p=b[r][c];if(!p)return [];var m=[],w=p.w;
    function add(tr,tc){if(!inb(tr,tc))return false;var q=b[tr][tc];if(q&&q.w===w)return false;m.push([tr,tc]);return !q;}
    if(p.t==="p"){var dir=w?-1:1,sr=w?6:1;
      if(inb(r+dir,c)&&!b[r+dir][c]){m.push([r+dir,c]);if(r===sr&&!b[r+2*dir][c])m.push([r+2*dir,c]);}
      [[dir,-1],[dir,1]].forEach(function(d){var tr=r+d[0],tc=c+d[1];if(inb(tr,tc)&&b[tr][tc]&&b[tr][tc].w!==w)m.push([tr,tc]);});}
    else if(p.t==="n"){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(d){add(r+d[0],c+d[1]);});}
    else if(p.t==="k"){[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){add(r+d[0],c+d[1]);});}
    else{var dirs=p.t==="b"?[[-1,-1],[-1,1],[1,-1],[1,1]]:p.t==="r"?[[-1,0],[1,0],[0,-1],[0,1]]:[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
      dirs.forEach(function(d){var tr=r+d[0],tc=c+d[1];while(add(tr,tc)){tr+=d[0];tc+=d[1];}});}
    return m;}
  function renderChess(){var board=$("#schBoard");board.innerHTML="";var moves=CH.sel?chMoves(CH.sel[0],CH.sel[1]):[];
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){(function(r,c){var sq=document.createElement("div");sq.className="sq "+((r+c)%2?"dark":"light");
      var p=CH.board[r][c];if(p)sq.textContent=PIECE[p.w?"w":"b"][p.t];
      if(CH.sel&&CH.sel[0]===r&&CH.sel[1]===c)sq.classList.add("sel");
      if(moves.some(function(mm){return mm[0]===r&&mm[1]===c;}))sq.classList.add(CH.board[r][c]?"cap":"move");
      sq.addEventListener("click",function(){chClick(r,c);});board.appendChild(sq);})(r,c);}}
  function chClick(r,c){if(CH.over||CH.turn!=="w")return;var p=CH.board[r][c];
    if(CH.sel){var moves=chMoves(CH.sel[0],CH.sel[1]);if(moves.some(function(mm){return mm[0]===r&&mm[1]===c;})){chMove(CH.sel[0],CH.sel[1],r,c);CH.sel=null;return;}}
    if(p&&p.w){CH.sel=[r,c];renderChess();}else{CH.sel=null;renderChess();}}
  function chMove(fr,fc,tr,tc){var b=CH.board,moving=b[fr][fc],target=b[tr][tc];b[tr][tc]=moving;b[fr][fc]=null;
    if(moving.t==="p"&&(tr===0||tr===7))moving.t="q";sCorrect();
    if(target&&target.t==="k"){renderChess();return chWin(moving.w);}
    renderChess();CH.turn=moving.w?"b":"w";
    if(CH.turn==="b"){$("#schTurn").textContent="Computer denkt …";setTimeout(cpuChess,650);}else $("#schTurn").textContent="Du bist dran";}
  function cpuChess(){if(CH.over)return;var all=[],VAL={p:1,n:3,b:3,r:5,q:9,k:100};
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){var p=CH.board[r][c];if(p&&!p.w)chMoves(r,c).forEach(function(mm){var tgt=CH.board[mm[0]][mm[1]];all.push({f:[r,c],t:mm,val:tgt?VAL[tgt.t]:0});});}
    if(!all.length){CH.over=true;$("#schMsg").textContent="Der Computer kann nicht ziehen – du gewinnst! 🎉";return;}
    var mv;
    if(chLevel===1){ // Leicht: meist zufällig
      mv = Math.random()<0.65 ? all[rnd(all.length)] : pickBest(all,0);
    } else if(chLevel===2){ // Mittel: bester Schlagzug, sonst zufällig
      mv = pickBest(all,0);
    } else { // Schwer: Schlagwert minus Risiko (1 Zug vorausschauen)
      all.forEach(function(m){var b=CH.board,mov=b[m.f[0]][m.f[1]],tgt=b[m.t[0]][m.t[1]];
        b[m.t[0]][m.t[1]]=mov;b[m.f[0]][m.f[1]]=null;
        m.score=m.val-(underThreat(m.t[0],m.t[1])?VAL[mov.t]*0.9:0);
        b[m.f[0]][m.f[1]]=mov;b[m.t[0]][m.t[1]]=tgt;});
      var bs=-1e9;all.forEach(function(m){if(m.score>bs)bs=m.score;});
      var topS=all.filter(function(m){return m.score===bs;});mv=topS[rnd(topS.length)];
    }
    chMove(mv.f[0],mv.f[1],mv.t[0],mv.t[1]);}
  function pickBest(all){var best=-1;all.forEach(function(m){if(m.val>best)best=m.val;});var top=all.filter(function(m){return m.val===best;});return top[rnd(top.length)];}
  function chWin(whiteWon){CH.over=true;CH.sel=null;if(whiteWon)confetti();var p=active();
    $("#schMsg").innerHTML=(whiteWon?"🎉 Du hast gewonnen!":"Der Computer gewinnt.")+' &nbsp;<button class="next" id="schAgain">Nochmal (🪙 6)</button>';
    var again=$("#schAgain");if(again)again.addEventListener("click",function(){if(!p||(p.stats.coins||0)<6){openGames();return;}p.stats.coins-=6;persist();$("#coinCount").textContent=p.stats.coins;startChess();});}

  /* ---------- KAUFLADEN & KASSE (Rollenspiel gegen den Computer) ---------- */
  var SHOPITEMS=[{e:"🍎",p:3},{e:"🍌",p:2},{e:"🍞",p:4},{e:"🥛",p:3},{e:"🧀",p:6},{e:"🍫",p:2},{e:"🎈",p:5},{e:"🧸",p:12},{e:"🚗",p:9},{e:"⚽",p:8},{e:"📗",p:7},{e:"🧃",p:2},{e:"🍉",p:6},{e:"👟",p:19}];
  var KUNDEN=["🧑","👩","👱","🧔","👵","👦","👧","🧕","👴","🧒"];
  var KASSE={on:false,score:0,items:[],total:0,bill:0,method:"",step:""};
  function startShop(){KASSE={on:true,score:0};$("#shopScore").textContent="0";show("shop");nextKunde();}
  function nextKunde(){
    $("#shopFb").textContent="";$("#shopFb").className="feedback";
    var items=shuffle(SHOPITEMS).slice(0,1+rnd(3)),total=items.reduce(function(a,b){return a+b.p;},0);
    while(total>60){items=shuffle(SHOPITEMS).slice(0,1+rnd(2));total=items.reduce(function(a,b){return a+b.p;},0);}
    KASSE.items=items;KASSE.total=total;KASSE.step="total";
    $("#kundeAv").textContent=pick(KUNDEN);$("#kundeMsg").textContent="Hallo! Das möchte ich kaufen. Was muss ich zahlen?";
    var t=$("#theke");t.innerHTML="";items.forEach(function(it){var d=document.createElement("div");d.className="shopitem";d.innerHTML='<span>'+it.e+'</span><span class="pricetag">'+it.p+' €</span>';t.appendChild(d);});
    $("#kassenDisplay").textContent="? €";
    var opts=uniq(total,function(){var d=total+(rnd(2)?1:-1)*(1+rnd(6));return d<1?total+1:d;},3);
    var box=$("#kasseStep");box.innerHTML='<div class="muted">Tippe den Gesamtpreis in die Kasse:</div>';
    var row=document.createElement("div");row.className="answers three";
    opts.forEach(function(v){var b=document.createElement("button");b.className="opt";b.textContent=v+" €";b.addEventListener("click",function(){
      if(!KASSE.on)return;
      if(v===total){sCorrect();$("#kassenDisplay").textContent=total+" €";askPay();}
      else{sWrong();b.classList.add("bad");b.disabled=true;$("#shopFb").className="feedback try";$("#shopFb").textContent="Zähl die Preise zusammen.";}
    });row.appendChild(b);});box.appendChild(row);
  }
  function askPay(){
    $("#shopFb").textContent="";$("#shopFb").className="feedback";
    KASSE.method=Math.random()<0.5?"karte":"bar";var box=$("#kasseStep");box.innerHTML="";
    if(KASSE.method==="karte"){
      $("#kundeMsg").textContent="Ich zahle mit Karte. 💳";
      box.innerHTML='<div class="terminal">💳<div class="muted" style="font-size:.85rem">Karte bereit – bitte bestätigen</div></div>';
      var btn=document.createElement("button");btn.className="next";btn.textContent="Karte akzeptieren ✅";
      btn.addEventListener("click",function(){if(!KASSE.on)return;$("#kundeMsg").textContent="Danke! Zahlung erfolgreich. ✅";sStar();doneKunde();});
      box.appendChild(btn);
    } else {
      var bills=[10,20,50],bill=bills.filter(function(x){return x>=KASSE.total;})[0]||50;KASSE.bill=bill;var change=bill-KASSE.total;
      $("#kundeMsg").textContent="Ich zahle bar mit "+bill+" €. 💶";
      box.innerHTML='<div class="muted">Gib das Rückgeld: '+bill+' € − '+KASSE.total+' €</div>';
      var row=document.createElement("div");row.className="answers three";
      var opts=uniq(change,function(){var d=change+(rnd(2)?1:-1)*(1+rnd(5));return d<0?change+1:d;},3);
      opts.forEach(function(v){var b=document.createElement("button");b.className="opt";b.textContent=v+" €";b.addEventListener("click",function(){
        if(!KASSE.on)return;
        if(v===change){sStar();$("#kundeMsg").textContent="Danke, stimmt genau! 😊";doneKunde();}
        else{sWrong();b.classList.add("bad");b.disabled=true;$("#shopFb").className="feedback try";$("#shopFb").textContent="Rechne "+bill+" − "+KASSE.total+".";}
      });row.appendChild(b);});box.appendChild(row);
    }
  }
  function doneKunde(){
    KASSE.score++;$("#shopScore").textContent=KASSE.score;var p=active();
    if(p){p.stats.coins=(p.stats.coins||0)+2;persist();$("#coinCount").textContent=p.stats.coins;}
    $("#shopFb").className="feedback ok";$("#shopFb").innerHTML="✅ Kasse stimmt! +2 🪙";
    var box=$("#kasseStep");box.innerHTML="";var nb=document.createElement("button");nb.className="next";nb.textContent="Nächster Kunde →";nb.addEventListener("click",function(){if(KASSE.on)nextKunde();});box.appendChild(nb);
  }

  /* ---------- VIER GEWINNT ---------- */
  var VIER=null;
  function startVier(){VIER={board:[],turn:"R",over:false};for(var r=0;r<6;r++)VIER.board.push([null,null,null,null,null,null,null]);
    $("#vierTurn").textContent="Du bist dran 🔴";$("#vierMsg").textContent="Bringe 4 in eine Reihe!";show("vier");renderVier();}
  function renderVier(){var b=$("#vierBoard");b.innerHTML="";for(var r=0;r<6;r++)for(var c=0;c<7;c++){(function(r,c){var s=document.createElement("div");
    s.className="vslot"+(VIER.board[r][c]?" "+VIER.board[r][c]:"");s.addEventListener("click",function(){vierDrop(c,"R",true);});b.appendChild(s);})(r,c);}}
  function vierLowest(c){for(var r=5;r>=0;r--)if(!VIER.board[r][c])return r;return -1;}
  function vierFull(){return VIER.board[0].every(function(x){return x;});}
  function vierWin(r,c,who){var dirs=[[0,1],[1,0],[1,1],[1,-1]];for(var d=0;d<4;d++){var cnt=1;for(var s=-1;s<=1;s+=2){var rr=r+dirs[d][0]*s,cc=c+dirs[d][1]*s;
    while(rr>=0&&rr<6&&cc>=0&&cc<7&&VIER.board[rr][cc]===who){cnt++;rr+=dirs[d][0]*s;cc+=dirs[d][1]*s;}}if(cnt>=4)return true;}return false;}
  function vierDrop(c,who,human){if(VIER.over)return;if(human&&VIER.turn!=="R")return;var r=vierLowest(c);if(r<0)return;
    VIER.board[r][c]=who;sCorrect();renderVier();
    if(vierWin(r,c,who)){VIER.over=true;if(who==="R")confetti();$("#vierMsg").innerHTML=(who==="R"?"🎉 Du hast gewonnen!":"Der Computer gewinnt.")+' &nbsp;<button class="next" id="vierAgain">Nochmal</button>';var ag=$("#vierAgain");if(ag)ag.addEventListener("click",startVier);return;}
    if(vierFull()){VIER.over=true;$("#vierMsg").textContent="Unentschieden!";return;}
    if(who==="R"){VIER.turn="Y";$("#vierTurn").textContent="Computer …";setTimeout(vierCpu,500);}else{VIER.turn="R";$("#vierTurn").textContent="Du bist dran 🔴";}}
  function vierCpu(){if(VIER.over)return;function wins(col,who){var r=vierLowest(col);if(r<0)return false;VIER.board[r][col]=who;var w=vierWin(r,col,who);VIER.board[r][col]=null;return w;}
    var cols=[];for(var c=0;c<7;c++)if(vierLowest(c)>=0)cols.push(c);var move=null;
    for(var i=0;i<cols.length;i++)if(wins(cols[i],"Y")){move=cols[i];break;}
    if(move===null)for(var j=0;j<cols.length;j++)if(wins(cols[j],"R")){move=cols[j];break;}
    if(move===null){var order=[3,2,4,1,5,0,6].filter(function(c){return cols.indexOf(c)>=0;});move=order[0];}
    vierDrop(move,"Y",false);}

  /* ---------- GALGENMÄNNCHEN ---------- */
  var GAL=null,GALWORDS=[{w:"HUND",h:"🐶 Tier"},{w:"KATZE",h:"🐱 Tier"},{w:"APFEL",h:"🍎 Obst"},{w:"SONNE",h:"☀️ am Himmel"},{w:"BAUM",h:"🌳 Pflanze"},{w:"AUTO",h:"🚗 Fahrzeug"},{w:"HAUS",h:"🏠 Gebäude"},{w:"BLUME",h:"🌸 Pflanze"},{w:"MAUS",h:"🐭 Tier"},{w:"STERN",h:"⭐ am Himmel"},{w:"BALL",h:"⚽ Spielzeug"},{w:"FISCH",h:"🐟 Tier"},
    {w:"BANANE",h:"🍌 Obst"},{w:"ELEFANT",h:"🐘 Tier"},{w:"FAHRRAD",h:"🚲 Fahrzeug"},{w:"GITARRE",h:"🎸 Musik"},{w:"BLEISTIFT",h:"✏️ Schule"},{w:"KROKODIL",h:"🐊 Tier"},{w:"REGENBOGEN",h:"🌈 am Himmel"},{w:"SONNENBLUME",h:"🌻 Pflanze"},{w:"SCHMETTERLING",h:"🦋 Tier"},{w:"COMPUTER",h:"💻 Technik"},{w:"PINGUIN",h:"🐧 Tier"},{w:"ERDBEERE",h:"🍓 Obst"}];
  function startGalgen(){var it=pick(GALWORDS);GAL={word:it.w,guessed:[],lives:6,over:false};$("#galgenHint").textContent="Tipp: "+it.h;$("#galgenMsg").textContent="";$("#galgenMsg").className="feedback";show("galgen");renderGalgen();}
  function renderGalgen(){$("#galgenLife").textContent=GAL.lives>0?Array(GAL.lives+1).join("❤️"):"💀";
    $("#galgenWord").textContent=GAL.word.split("").map(function(ch){return GAL.guessed.indexOf(ch)>=0?ch:"_";}).join(" ");
    var keys=$("#galgenKeys");keys.innerHTML="";"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function(ch){var b=document.createElement("button");b.textContent=ch;
      if(GAL.guessed.indexOf(ch)>=0||GAL.over)b.disabled=true;b.addEventListener("click",function(){galGuess(ch);});keys.appendChild(b);});}
  function galGuess(ch){if(GAL.over||GAL.guessed.indexOf(ch)>=0)return;GAL.guessed.push(ch);if(GAL.word.indexOf(ch)>=0)sCorrect();else{GAL.lives--;sWrong();}
    var done=GAL.word.split("").every(function(c){return GAL.guessed.indexOf(c)>=0;});renderGalgen();
    if(done){GAL.over=true;confetti();$("#galgenMsg").className="feedback ok";$("#galgenMsg").innerHTML="🎉 Richtig: "+GAL.word+' &nbsp;<button class="next" id="galAgain">Nochmal</button>';renderGalgen();var ag=$("#galAgain");if(ag)ag.addEventListener("click",startGalgen);}
    else if(GAL.lives<=0){GAL.over=true;$("#galgenMsg").className="feedback try";$("#galgenMsg").innerHTML="Das Wort war: "+GAL.word+' &nbsp;<button class="next" id="galAgain2">Nochmal</button>';renderGalgen();var ag2=$("#galAgain2");if(ag2)ag2.addEventListener("click",startGalgen);}}

  /* ---------- MALEN ---------- */
  var MAL=null;
  function startMalen(){show("malen");var cv=$("#malenCanvas"),ctx=cv.getContext("2d");MAL={ctx:ctx,color:"#ff5b5b",drawing:false};
    var cols=["#ff5b5b","#ff8a3d","#ffd23f","#2bb673","#2a7fff","#b07bff","#111111","#ffffff"],pal=$("#malenColors");pal.innerHTML="";
    cols.forEach(function(c,i){var b=document.createElement("button");b.style.background=c;b.setAttribute("aria-pressed",i===0);
      b.addEventListener("click",function(){MAL.color=c;Array.prototype.forEach.call(pal.children,function(x){x.setAttribute("aria-pressed",x===b);});});pal.appendChild(b);});
    setTimeout(function(){cv.width=cv.clientWidth;cv.height=cv.clientHeight;},60);
    function pos(e){var r=cv.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
    function down(e){MAL.drawing=true;var p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);if(e.cancelable)e.preventDefault();}
    function move(e){if(!MAL.drawing)return;var p=pos(e);ctx.strokeStyle=MAL.color;ctx.lineWidth=9;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineTo(p.x,p.y);ctx.stroke();if(e.cancelable)e.preventDefault();}
    function up(){MAL.drawing=false;}
    cv.onmousedown=down;cv.onmousemove=move;window.onmouseup=up;cv.ontouchstart=down;cv.ontouchmove=move;cv.ontouchend=up;}
  function clearMalen(){var cv=$("#malenCanvas");if(MAL&&MAL.ctx)MAL.ctx.clearRect(0,0,cv.width,cv.height);}

  /* ---------- POKALE / ABZEICHEN ---------- */
  var BADGES=[
    {id:"first",e:"⭐",n:"Erster Stern",d:"Sammle 1 Stern",ok:function(s){return s.stars>=1;}},
    {id:"stars25",e:"🌟",n:"Stern-Sammler",d:"25 Sterne",ok:function(s){return s.stars>=25;}},
    {id:"stars100",e:"✨",n:"Stern-Meister",d:"100 Sterne",ok:function(s){return s.stars>=100;}},
    {id:"correct50",e:"✅",n:"Fleißig",d:"50 richtige Antworten",ok:function(s){return s.correct>=50;}},
    {id:"allsubj",e:"🎓",n:"Entdecker",d:"Jedes Fach probiert",ok:function(s){return SUBJ.every(function(x){return (s.best[x.k]||0)>0;});}},
    {id:"streak3",e:"🔥",n:"Dranbleiber",d:"3 Tage in Folge",ok:function(s){return (s.streak||0)>=3;}},
    {id:"coins50",e:"🪙",n:"Münz-König",d:"50 Münzen",ok:function(s){return (s.coins||0)>=50;}},
    {id:"ballon15",e:"🎈",n:"Ballon-Profi",d:"15 bei Zahlen-Ballons",ok:function(s){return (s.ballonBest||0)>=15;}}
  ];
  function openBadges(){var p=active();if(!p)return;var g=$("#badgesGrid");g.innerHTML="";var got=0;
    BADGES.forEach(function(bd){var earned=bd.ok(p.stats);if(earned)got++;var d=document.createElement("div");d.className="badge"+(earned?"":" locked");
      d.innerHTML='<div class="be">'+(earned?bd.e:"🔒")+'</div><div class="bn">'+bd.n+'</div><div class="bd">'+bd.d+'</div>';g.appendChild(d);});
    $("#badgesSub").textContent=got+" von "+BADGES.length+" Abzeichen gesammelt.";show("badges");}

  /* ---------- RECHEN-MEMORY (Aufgabe ↔ Ergebnis) ---------- */
  var RMEM={on:false,first:null,lock:false,moves:0,pairs:0,total:6};
  function startRmem(){RMEM={on:true,first:null,lock:false,moves:0,pairs:0,total:6};$("#rmemMoves").textContent="0";$("#rmemPairs").textContent="0";
    var used={},cards=[],n=0;while(n<RMEM.total){var a=1+rnd(9),b=1+rnd(9),res=a+b;if(used[res]){continue;}used[res]=1;n++;cards.push({val:res,kind:"eq",label:a+"+"+b});cards.push({val:res,kind:"num",label:""+res});}
    cards=shuffle(cards);var g=$("#rmemGrid");g.innerHTML="";cards.forEach(function(c){var el=document.createElement("div");el.className="rcard";el._c=c;el.textContent="?";el.addEventListener("click",function(){rmemFlip(el);});g.appendChild(el);});show("rmem");}
  function rmemFlip(el){if(!RMEM.on||RMEM.lock||el.classList.contains("open")||el.classList.contains("done"))return;el.classList.add("open");el.textContent=el._c.label;
    if(!RMEM.first){RMEM.first=el;return;}RMEM.moves++;$("#rmemMoves").textContent=RMEM.moves;var a=RMEM.first,b=el;
    if(a._c.val===b._c.val&&a._c.kind!==b._c.kind){a.classList.add("done");b.classList.add("done");RMEM.first=null;RMEM.pairs++;$("#rmemPairs").textContent=RMEM.pairs;sStar();if(RMEM.pairs>=RMEM.total)rmemEnd();}
    else{RMEM.lock=true;RMEM.first=null;sWrong();setTimeout(function(){a.classList.remove("open");a.textContent="?";b.classList.remove("open");b.textContent="?";RMEM.lock=false;},800);}}
  function rmemEnd(){RMEM.on=false;confetti();var p=active();
    $("#rmemGrid").innerHTML='<div class="gresult" style="grid-column:1/-1"><div style="font-size:3rem">🧮</div><h2 class="display" style="margin:0;font-size:1.4rem">Alle Paare gefunden!</h2><p class="muted" style="margin:0">'+RMEM.moves+' Versuche</p><button class="next" id="rmemAgain">Nochmal (🪙 5)</button></div>';
    var ag=$("#rmemAgain");if(ag)ag.addEventListener("click",function(){if(!p||(p.stats.coins||0)<5){openGames();return;}p.stats.coins-=5;persist();$("#coinCount").textContent=p.stats.coins;startRmem();});}

  /* ---------- ZAHLEN-PYRAMIDE ---------- */
  var PYRA={on:false,round:0,score:0,total:8};
  function startPyra(){PYRA={on:true,round:0,score:0,total:8};$("#pyraScore").textContent="0";show("pyra");pyraNext();}
  function pyraNext(){if(PYRA.round>=PYRA.total)return pyraEnd();PYRA.round++;$("#pyraFb").textContent="";$("#pyraFb").className="feedback";
    var b1=1+rnd(9),b2=1+rnd(9),b3=1+rnd(9),m1=b1+b2,m2=b2+b3,top=m1+m2,bricks={top:top,m1:m1,m2:m2},hideKey=pick(["top","m1","m2"]),correct=bricks[hideKey];
    $("#pyraView").innerHTML='<div class="pyrow"><div class="brick '+(hideKey==="top"?"q":"")+'">'+(hideKey==="top"?"?":top)+'</div></div>'
      +'<div class="pyrow"><div class="brick '+(hideKey==="m1"?"q":"")+'">'+(hideKey==="m1"?"?":m1)+'</div><div class="brick '+(hideKey==="m2"?"q":"")+'">'+(hideKey==="m2"?"?":m2)+'</div></div>'
      +'<div class="pyrow"><div class="brick">'+b1+'</div><div class="brick">'+b2+'</div><div class="brick">'+b3+'</div></div>';
    var opts=uniq(correct,function(){var d=correct+(rnd(2)?1:-1)*(1+rnd(4));return d<0?correct+1:d;},3),box=$("#pyraAns");box.innerHTML="";
    opts.forEach(function(x){var btn=document.createElement("button");btn.className="opt";btn.textContent=x;btn.addEventListener("click",function(){pyraAns(x===correct,btn);});box.appendChild(btn);});}
  function pyraAns(ok,btn){if(!PYRA.on)return;var p=active();
    if(ok){PYRA.score++;$("#pyraScore").textContent=PYRA.score;sCorrect();btn.classList.add("good");Array.prototype.forEach.call($("#pyraAns").children,function(c){c.disabled=true;});
      if(p){p.stats.coins=(p.stats.coins||0)+1;persist();$("#coinCount").textContent=p.stats.coins;}$("#pyraFb").className="feedback ok";$("#pyraFb").innerHTML="⭐ Richtig! +1 🪙";setTimeout(pyraNext,850);}
    else{sWrong();btn.classList.add("bad");btn.disabled=true;$("#pyraFb").className="feedback try";$("#pyraFb").textContent="Zähl die zwei Steine darunter zusammen.";}}
  function pyraEnd(){PYRA.on=false;confetti();$("#pyraView").innerHTML="";$("#pyraAns").innerHTML="";$("#pyraFb").className="feedback ok";$("#pyraFb").innerHTML=PYRA.score+" von "+PYRA.total+" richtig! &nbsp;<button class=\"next\" id=\"pyraAgain\">Nochmal</button>";var ag=$("#pyraAgain");if(ag)ag.addEventListener("click",startPyra);}

  /* ---------- QUIZ-DUELL AUF ZEIT ---------- */
  var QUIZPOOL=[].concat(SACH_TIERE,SACH_KOERPER,SACH_JAHR,SACH_VERKEHR,GEO_WELT,GEO_FLAG,MUS_INSTR),QUIZ={on:false,score:0,time:30,timer:0};
  function startQuiz(){QUIZ={on:true,score:0,time:30,timer:0};$("#quizScore").textContent="0";$("#quizTime").textContent="30";show("quiz");quizNext();
    QUIZ.timer=setInterval(function(){QUIZ.time--;$("#quizTime").textContent=QUIZ.time;if(QUIZ.time<=0)endQuiz();},1000);}
  function quizNext(){var it=pick(QUIZPOOL);$("#quizLabel").textContent=it.q;$("#quizQ").innerHTML='<span class="em">'+(it.e||"🦉")+'</span>';
    var opts=shuffle(it.a.slice()),box=$("#quizAns");box.innerHTML="";$("#quizFb").textContent="";$("#quizFb").className="feedback";
    opts.forEach(function(v){var b=document.createElement("button");b.className="opt";b.innerHTML='<span class="word">'+v+'</span>';b.addEventListener("click",function(){quizAns(v===it.a[0],b);});box.appendChild(b);});}
  function quizAns(ok,btn){if(!QUIZ.on)return;if(ok){QUIZ.score++;$("#quizScore").textContent=QUIZ.score;sCorrect();quizNext();}else{sWrong();btn.classList.add("bad");btn.disabled=true;}}
  function stopQuiz(){QUIZ.on=false;clearInterval(QUIZ.timer);}
  function endQuiz(){stopQuiz();confetti();var p=active();if(p&&QUIZ.score>(p.stats.quizBest||0)){p.stats.quizBest=QUIZ.score;persist();}
    $("#quizLabel").textContent="Fertig! 🦉";$("#quizQ").innerHTML="";$("#quizAns").innerHTML="";$("#quizFb").className="feedback ok";
    $("#quizFb").innerHTML=QUIZ.score+" richtig! &nbsp;<button class=\"next\" id=\"quizAgain\">Nochmal (🪙 4)</button>";
    var ag=$("#quizAgain");if(ag)ag.addEventListener("click",function(){if(!p||(p.stats.coins||0)<4){openGames();return;}p.stats.coins-=4;persist();$("#coinCount").textContent=p.stats.coins;startQuiz();});}

  /* ---------- AVATAR-SHOP ---------- */
  var AV_PREMIUM=[{e:"🐉",c:20},{e:"🦅",c:20},{e:"🦁",c:15},{e:"🐼",c:15},{e:"🦖",c:25},{e:"🤖",c:15},{e:"👑",c:30},{e:"🦸",c:25},{e:"🧙",c:20},{e:"🦄",c:30}];
  function openAvatar(flash){var p=active();if(!p)return;if(!p.stats.unlocked)p.stats.unlocked=[];
    $("#avatarCoins").textContent=p.stats.coins||0;var g=$("#avatarGrid");g.innerHTML="";
    AVATARS.forEach(function(a){g.appendChild(avBtn(p,a,0));});AV_PREMIUM.forEach(function(it){g.appendChild(avBtn(p,it.e,it.c));});
    var m=$("#avatarMsg");if(flash){m.className="feedback ok";m.textContent=flash;}else{m.className="feedback";m.textContent="";}show("avatar");}
  function avBtn(p,emoji,cost){var unlocked=cost===0||p.stats.unlocked.indexOf(emoji)>=0;
    var b=document.createElement("button");b.setAttribute("aria-pressed",p.av===emoji);
    if(unlocked){b.textContent=emoji;}else{b.className="locked";b.innerHTML=emoji+'<span class="cost">🪙 '+cost+'</span>';}
    b.addEventListener("click",function(){
      if(unlocked){p.av=emoji;persist();$("#whoAv").textContent=emoji;openAvatar();}
      else if((p.stats.coins||0)<cost){$("#avatarMsg").className="feedback try";$("#avatarMsg").textContent="Dafür brauchst du "+cost+" Münzen. Übe weiter!";}
      else{p.stats.coins-=cost;p.stats.unlocked.push(emoji);p.av=emoji;persist();$("#coinCount").textContent=p.stats.coins;$("#whoAv").textContent=emoji;openAvatar("Freigeschaltet! ✨");}
    });return b;}

  /* ---------- LERNZIEL (Sterne heute) ---------- */
  function renderGoal(){var p=active();if(!p)return;var goal=p.stats.goal||10,today=(p.stats.history&&p.stats.history[dayKey()]||{}).stars||0;
    var pct=Math.min(100,Math.round(today/goal*100));
    $("#homeGoal").innerHTML='<div class="goalrow">🎯 Tagesziel: <b>'+today+' / '+goal+' ⭐</b>'+(today>=goal?' <span style="color:var(--good)">geschafft! 🎉</span>':'')+'</div><div class="barmini"><i style="width:'+pct+'%"></i></div>';}

  /* ---------- LERNZEIT (Schulmodus: mehrere Stunden nacheinander) ---------- */
  var SCHOOL={on:false,lessons:[],idx:0,results:[]};
  function renderSchoolPlan(){var plan=$("#schoolPlan");plan.innerHTML="";
    SCHOOL.lessons.forEach(function(L,i){var d=document.createElement("div");d.className="lessonrow";
      d.innerHTML='<span class="no">'+(i+1)+'</span><span class="ic">'+L.emoji+'</span><span class="lt">'+L.name+'</span><span class="lst">tippen zum Wechseln ↻</span>';
      d.addEventListener("click",function(){var idx=SUBJ.map(function(s){return s.k;}).indexOf(L.key),ns=SUBJ[(idx+1)%SUBJ.length];L.key=ns.k;L.emoji=ns.e;L.name=ns.n;renderSchoolPlan();});
      plan.appendChild(d);});}
  function startSchool(){var picks=shuffle(SUBJ).slice(0,4);SCHOOL={on:false,lessons:picks.map(function(s){return {key:s.k,level:2,emoji:s.e,name:s.n};}),idx:0,results:[]};renderSchoolPlan();show("school");}
  function schoolBegin(){if(!SCHOOL.lessons.length)return;SCHOOL.on=true;SCHOOL.idx=0;SCHOOL.results=[];runLesson();}
  function runLesson(){var L=SCHOOL.lessons[SCHOOL.idx];curGame=L.key;curLevel=L.level;try{tone(880,.15);setTimeout(function(){tone(660,.2);},160);}catch(e){}toast("🔔 Stunde "+(SCHOOL.idx+1)+": "+L.name);startGame();}
  function schoolAdvance(){SCHOOL.idx++;if(SCHOOL.idx>=SCHOOL.lessons.length){return showZeugnis();}runLesson();}
  function showZeugnis(){SCHOOL.on=false;confetti();var g=$("#zeugGrid");g.innerHTML="";
    SCHOOL.results.forEach(function(r,i){var stars=r.earned>=9?"★★★":r.earned>=6?"★★":r.earned>=1?"★":"☆";var d=document.createElement("div");d.className="lessonrow";
      d.innerHTML='<span class="no">'+(i+1)+'</span><span class="ic">'+r.emoji+'</span><span class="lt">'+r.name+'</span><span class="lst" style="color:var(--star)">'+stars+' · '+r.earned+'/10</span>';g.appendChild(d);});
    show("zeugnis");}
  /* Schatztruhe */
  function openChest(){var p=active();if(!p)return;
    if(p.stats.lastChest===dayKey()){$("#chestEmoji").textContent="📦";$("#chestTitle").textContent="Heute schon geöffnet";$("#chestText").textContent="Komm morgen wieder für ein neues Geschenk!";$("#chestOpen").style.display="none";}
    else{$("#chestEmoji").textContent="🎁";$("#chestTitle").textContent="Tägliche Schatztruhe";$("#chestText").textContent="Jeden Tag ein Geschenk – mach sie auf!";$("#chestOpen").style.display="";}
    show("chest");}
  function doOpenChest(){var p=active();if(!p||p.stats.lastChest===dayKey())return;var coins=3+rnd(6),stars=1+rnd(3);
    p.stats.coins=(p.stats.coins||0)+coins;p.stats.stars=(p.stats.stars||0)+stars;p.stats.lastChest=dayKey();persist();
    $("#coinCount").textContent=p.stats.coins;$("#starCount").textContent=p.stats.stars;confetti();sStar();
    $("#chestEmoji").textContent="🎉";$("#chestTitle").textContent="Geschenk!";$("#chestText").innerHTML="Du bekommst <b>"+coins+" 🪙</b> und <b>"+stars+" ⭐</b>!";$("#chestOpen").style.display="none";}
  /* Haustier */
  var PETS=[{min:0,e:"🥚",n:"Ei"},{min:10,e:"🐣",n:"Küken"},{min:30,e:"🐥",n:"Vögelchen"},{min:60,e:"🐔",n:"Huhn"},{min:100,e:"🦚",n:"Prachtvogel"}];
  function openPet(){var p=active();if(!p)return;var st=p.stats.stars||0,stage=PETS[0],next=null;
    for(var i=0;i<PETS.length;i++){if(st>=PETS[i].min){stage=PETS[i];next=PETS[i+1]||null;}}
    $("#petEmoji").textContent=stage.e;$("#petName").textContent="Dein Tier: "+stage.n;
    if(next){$("#petText").textContent="Noch "+(next.min-st)+" Sterne bis "+next.e+".";$("#petBar").style.width=Math.round((st-stage.min)/(next.min-stage.min)*100)+"%";}
    else{$("#petText").textContent="Höchste Stufe erreicht – toll! 🎉";$("#petBar").style.width="100%";}
    show("pet");}
  function petStreichel(){sStar();var e=$("#petEmoji");e.style.transition="transform .2s";e.style.transform="scale(1.2)";setTimeout(function(){e.style.transform="";},220);toast("❤️");}
  /* Große Schrift */
  function applyBig(){try{document.documentElement.style.fontSize=load("antona_big",false)?"18.5px":"";}catch(e){}}


  /* ---------- ANTONA FOKUS: Aufmerksamkeit, Arbeitsgedächtnis, Muster & Reflexion ---------- */
  var FOCUS={mood:"bereit",round:0,total:4,correct:0,task:null,level:1,answered:false,selected:[],sequence:[]};
  function focusStats(p){if(!p.stats.focusSessions)p.stats.focusSessions=0;if(!p.stats.focusMinutes)p.stats.focusMinutes=0;if(!p.stats.focusLevel)p.stats.focusLevel=1;if(!p.stats.focusHistory)p.stats.focusHistory=[];}
  function openFocus(){var p=active();if(!p)return;focusStats(p);FOCUS.mood="bereit";
    $("#focusStart").hidden=false;$("#focusPlay").hidden=true;$("#focusResult").hidden=true;
    Array.prototype.forEach.call(document.querySelectorAll("[data-mood]"),function(b){b.setAttribute("aria-pressed",b.getAttribute("data-mood")==="bereit"?"true":"false");});
    $("#focusStartHint").textContent="Wir starten mit einer kurzen, ruhigen Einheit.";show("focus");}
  function focusBegin(){var p=active();if(!p)return;focusStats(p);
    FOCUS={mood:FOCUS.mood,round:0,total:FOCUS.mood==="unruhig"?3:4,correct:0,task:null,level:Math.max(1,Math.min(5,p.stats.focusLevel||1)),answered:false,selected:[],sequence:[]};
    $("#focusStart").hidden=true;$("#focusPlay").hidden=false;$("#focusResult").hidden=true;focusNext();}
  function focusNext(){if(FOCUS.round>=FOCUS.total)return focusFinish();FOCUS.round++;FOCUS.answered=false;FOCUS.selected=[];
    $("#focusStep").textContent="Übung "+FOCUS.round+"/"+FOCUS.total;$("#focusLevel").textContent="Stufe "+FOCUS.level;
    $("#focusProgress").style.width=Math.round((FOCUS.round-1)/FOCUS.total*100)+"%";$("#focusFeedback").textContent="";$("#focusFeedback").className="feedback";
    $("#focusCheck").disabled=false;$("#focusCheck").textContent="Prüfen";var kind=(FOCUS.round-1)%4;
    if(kind===0)focusVisual();else if(kind===1)focusMemory();else if(kind===2)focusPattern();else focusInstruction();
  }
  function focusVisual(){var target="⭐",pool=["🌙","🍀","🎈","🌸","🔷","🐠","☀️"],count=2+Math.min(FOCUS.level,3),arr=[];
    for(var i=0;i<count;i++)arr.push(target);while(arr.length<25)arr.push(pool[Math.floor(Math.random()*pool.length)]);
    arr.sort(function(){return Math.random()-.5;});FOCUS.task={type:"visual",target:target,answer:count};$("#focusTitle").textContent="Aufmerksam schauen";
    $("#focusPrompt").textContent="Tippe alle "+target+" an. Wie viele findest du?";
    var g=$("#focusBoard");g.className="focus-grid";g.innerHTML="";
    arr.forEach(function(v){var b=document.createElement("button");b.className="focus-cell";b.textContent=v;b.setAttribute("aria-label","Symbol");b.addEventListener("click",function(){if(FOCUS.answered||b.disabled)return;b.classList.add("selected");b.disabled=true;if(v===target)FOCUS.selected.push(1);else FOCUS.selected.push(0);});g.appendChild(b);});
  }
  function focusMemory(){var len=2+Math.min(FOCUS.level,3),seq=[];for(var i=0;i<len;i++)seq.push(1+Math.floor(Math.random()*9));FOCUS.task={type:"memory",answer:seq.join("")};FOCUS.sequence=seq;
    $("#focusTitle").textContent="Merk dir die Zahlen";$("#focusPrompt").textContent="Schau dir die Zahlenfolge an und merke sie dir.";
    var g=$("#focusBoard");g.className="";g.innerHTML='<div class="title" style="font-size:2.4rem;text-align:center;padding:1.4rem" id="focusSequence"></div><p class="focus-note">Die Zahlen verschwinden gleich.</p>';
    $("#focusSequence").textContent=seq.join(" · ");setTimeout(function(){if(FOCUS.task&&FOCUS.task.type==="memory"&&!FOCUS.answered){$("#focusSequence").textContent="Jetzt bist du dran!";$("#focusPrompt").textContent="Schreibe die Zahlen ohne Leerzeichen auf.";g.insertAdjacentHTML("beforeend",'<input id="focusAnswer" class="focus-input" inputmode="numeric" maxlength="6" aria-label="Zahlenfolge">');}},FOCUS.mood==="unruhig"?2600:1900);
  }
  function focusPattern(){var a=2+FOCUS.level,b=a+2,c=b+2;FOCUS.task={type:"pattern",answer:String(c+2)};$("#focusTitle").textContent="Muster erkennen";$("#focusPrompt").textContent="Welche Zahl kommt als Nächstes?  "+a+" · "+b+" · "+c+" · ?";
    var g=$("#focusBoard");g.className="focus-options";g.innerHTML="";[c+1,c+2,c+3,c+4].sort(function(){return Math.random()-.5;}).forEach(function(v){var b=document.createElement("button");b.className="focus-choice";b.textContent=v;b.addEventListener("click",function(){if(FOCUS.answered)return;FOCUS.selected=[String(v)];Array.prototype.forEach.call(g.children,function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});});g.appendChild(b);});
  }
  function focusInstruction(){var words=["ROT","BLAU","GRÜN","GELB"],seq=FOCUS.level>2?["ROT","GRÜN","BLAU"]:["BLAU","GELB"];FOCUS.task={type:"instruction",answer:seq.join(",")};
    $("#focusTitle").textContent="Schritt für Schritt";$("#focusPrompt").textContent="Merke dir die Reihenfolge und tippe sie danach ein.";
    var g=$("#focusBoard");g.className="";g.innerHTML='<div class="title" style="font-size:1.5rem;padding:1rem" id="focusInstructionText">'+seq.join(" → ")+'</div>';
    setTimeout(function(){if(FOCUS.task&&FOCUS.task.type==="instruction"&&!FOCUS.answered){$("#focusInstructionText").textContent="Welche Reihenfolge war es?";$("#focusPrompt").textContent="Schreibe die Farben in der richtigen Reihenfolge.";g.insertAdjacentHTML("beforeend",'<input id="focusAnswer" class="focus-input" aria-label="Reihenfolge" placeholder="z. B. BLAU,GELB">');}},FOCUS.mood==="unruhig"?2600:1900);
  }
  function focusCheck(){if(FOCUS.answered)return focusNext();if(!FOCUS.task)return;var ok=false,t=FOCUS.task;
    if(t.type==="visual"){var found=FOCUS.selected.filter(function(x){return x===1;}).length,wrong=FOCUS.selected.filter(function(x){return x===0;}).length;ok=found===t.answer&&wrong===0;}
    else if(t.type==="pattern"){ok=FOCUS.selected[0]===t.answer;}
    else{var inp=$("#focusAnswer");if(!inp){$("#focusFeedback").textContent="Warte kurz, bis die Aufgabe bereit ist.";return;}var val=inp.value.replace(/[^0-9A-Za-zÄÖÜäöü,]/g,"").toUpperCase().replace(/,/g,"");var ans=String(t.answer).replace(/,/g,"");ok=val===ans;}
    FOCUS.answered=true;if(ok){FOCUS.correct++;$("#focusFeedback").className="feedback ok";$("#focusFeedback").textContent="Genau hingeschaut! 🌟";}else{$("#focusFeedback").className="feedback try";$("#focusFeedback").textContent="Guter Versuch. Fehler helfen uns beim Üben – weiter geht’s!";}
    $("#focusCheck").disabled=false;$("#focusCheck").textContent="Weiter →";
  }
  function focusFinish(){var p=active();if(!p)return;focusStats(p);var pct=Math.round(FOCUS.correct/FOCUS.total*100);
    p.stats.focusSessions++;p.stats.focusMinutes+=(FOCUS.total===3?2:3);p.stats.focusHistory.push({date:dayKey(),score:FOCUS.correct,total:FOCUS.total,mood:FOCUS.mood});
    if(p.stats.focusHistory.length>30)p.stats.focusHistory.shift();
    if(pct>=75&&p.stats.focusLevel<5)p.stats.focusLevel++;else if(pct<40&&p.stats.focusLevel>1)p.stats.focusLevel--;
    p.stats.focusLastMood=FOCUS.mood;persist();$("#focusProgress").style.width="100%";
    $("#focusPlay").hidden=true;$("#focusResult").hidden=false;$("#focusCorrect").textContent=FOCUS.correct+"/"+FOCUS.total;$("#focusAccuracy").textContent=pct+"%";$("#focusBest").textContent=p.stats.focusLevel;
    var tip=pct>=75?"Du hast dich heute richtig gut konzentriert. Beim nächsten Mal wartet eine etwas anspruchsvollere Übung.":pct>=40?"Du bist drangeblieben. Wir üben weiter in kleinen Schritten – das ist genau richtig.":"Heute war es anspruchsvoll. Eine kurze Pause, etwas trinken und später noch einmal probieren kann helfen.";
    if(FOCUS.mood==="pause")tip="Du hast auf dich gehört. Eine Pause ist eine gute Entscheidung. Du kannst später wiederkommen.";
    $("#focusCoachText").textContent=tip;$("#focusSaved").textContent="Dein Fortschritt wurde nur auf diesem Gerät im Profil gespeichert.";
  }
  function focusReflect(value){var p=active();if(!p)return;focusStats(p);p.stats.focusLastReflection=value;persist();
    $("#focusSaved").textContent=value==="leicht"?"Schön, dass es heute leicht ging!":value==="mittel"?"Danke für deine ehrliche Einschätzung.":"Gut, dass du merkst, wann etwas anstrengend ist. Eine Pause ist okay.";}
  function openCoach(){var p=active();if(!p)return;focusStats(p);$("#coachSessions").textContent=p.stats.focusSessions;$("#coachMinutes").textContent=p.stats.focusMinutes;$("#coachLevel").textContent=p.stats.focusLevel;
    var hist=p.stats.focusHistory||[],last=hist.length?hist[hist.length-1]:null;
    $("#coachAdvice").textContent=last?(last.score>=last.total*.75?"Deine letzte Einheit lief gut. Wir erhöhen die Schwierigkeit langsam.":"Wir bleiben bei kurzen Übungen und wiederholen die Grundlagen."):"Starte mit einer kurzen Fokus-Einheit. Danach passen wir die nächste Übung an deinen Fortschritt an.";
    show("coach");}


  /* ---------- Lernplan-Fortschritt für Kinder und Eltern ---------- */
  var CURR_GROUPS=[
    {name:"Mathematik · Zahlen und Rechnen",game:"math"},
    {name:"Deutsch · Lesen und Schreiben",game:"read"},
    {name:"Messen, Formen und Daten",game:"shape"},
    {name:"Uhrzeit und Zeitspannen",game:"clock"},
    {name:"Arbeiten, Denken und Konzentration",game:"denken"},
    {name:"Sachaufgaben und Alltag",game:"sach"}
  ];
  function curriculumProgressHtml(p){
    var total=0,mastered=0,html="";
    CURR_GROUPS.forEach(function(g){
      var score=(p.stats.best&&p.stats.best[g.game])||0;
      var pct=Math.max(0,Math.min(100,Math.round(score/10*100)));
      total++;if(score>=8)mastered++;
      html+='<div class="curr-progress-row"><b>'+g.name+'</b><small>'+score+'/10 Punkte</small><div class="barmini"><i style="width:'+pct+'%"></i></div></div>';
    });
    return {html:html,total:total,mastered:mastered};
  }
  function renderCurriculumProgress(){
    var p=active();if(!p)return;
    var d=curriculumProgressHtml(p);
    $("#curriculumProgressRows").innerHTML=d.html;
    $("#parentCurriculumRows").innerHTML=d.html;
    $("#parentCurriculumSummary").textContent=d.mastered+" von "+d.total+" Lernbereichen zeigen aktuell mindestens 8 von 10 Punkten in der jeweils zugeordneten Übung. Das ist ein Übungsindikator, keine Schulnote.";
  }

  /* ---------- Lehrplan-Navigation ---------- */
  $("#curriculumOpen").addEventListener("click",function(){renderCurriculumProgress();show("curriculum");});
  $("#curriculumBack").addEventListener("click",enterHome);
  Array.prototype.forEach.call(document.querySelectorAll("[data-curr-game]"),function(b){
    b.addEventListener("click",function(){curGame=b.getAttribute("data-curr-game");curLevel=+b.getAttribute("data-curr-level");openLevels(curGame);});
  });
  Array.prototype.forEach.call(document.querySelectorAll(".social-goal"),function(c){
    c.addEventListener("change",function(){var chosen=document.querySelectorAll(".social-goal:checked").length;$("#socialGoalFeedback").textContent=chosen?chosen+" Lern-Challenge"+(chosen===1?"":"s")+" ausgewählt. Nimm dir heute eine davon vor.":"Kleine Schritte zählen. Du kannst eine Challenge auswählen.";});
  });

  /* ---------- Navigation ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".tile"),function(t){t.addEventListener("click",function(){openLevels(t.getAttribute("data-game"));});});

  $("#focusEntry").addEventListener("click",openFocus);
  $("#coachEntry").addEventListener("click",openCoach);
  $("#focusBack").addEventListener("click",enterHome);
  $("#coachBack").addEventListener("click",enterHome);
  $("#focusStartBtn").addEventListener("click",focusBegin);
  $("#focusCheck").addEventListener("click",focusCheck);
  $("#focusAgain").addEventListener("click",openFocus);
  $("#focusHome").addEventListener("click",enterHome);
  Array.prototype.forEach.call(document.querySelectorAll("[data-mood]"),function(b){b.addEventListener("click",function(){
    FOCUS.mood=b.getAttribute("data-mood");Array.prototype.forEach.call(document.querySelectorAll("[data-mood]"),function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});
    $("#focusStartHint").textContent=FOCUS.mood==="pause"?"Mach zuerst eine kleine Pause. Du kannst starten, wenn du bereit bist.":FOCUS.mood==="unruhig"?"Wir machen eine kürzere Einheit mit weniger Aufgaben.":"Wir starten mit einer kurzen, ruhigen Einheit.";
  });});
  Array.prototype.forEach.call(document.querySelectorAll("[data-reflect]"),function(b){b.addEventListener("click",function(){focusReflect(b.getAttribute("data-reflect"));});});

  $("#shopBack").addEventListener("click",function(){KASSE.on=false;openGames();});
  $("#vierBack").addEventListener("click",function(){if(VIER)VIER.over=true;openGames();});
  $("#galgenBack").addEventListener("click",function(){if(GAL)GAL.over=true;openGames();});
  $("#malenBack").addEventListener("click",openGames);
  $("#malenClear").addEventListener("click",clearMalen);
  $("#badgesBack").addEventListener("click",enterHome);
  var pokaleBtn=$("#pokaleBtn");if(pokaleBtn)pokaleBtn.addEventListener("click",openBadges);
  $("#quizBack").addEventListener("click",function(){stopQuiz();openGames();});
  $("#avatarBack").addEventListener("click",enterHome);
  var avatarBtn=$("#avatarBtn");if(avatarBtn)avatarBtn.addEventListener("click",function(){openAvatar();});
  $("#rmemBack").addEventListener("click",function(){RMEM.on=false;openGames();});
  $("#pyraBack").addEventListener("click",function(){PYRA.on=false;openGames();});
  $("#gamesBack").addEventListener("click",enterHome);
  $("#ballonBack").addEventListener("click",function(){stopBallon();openGames();});
  $("#blitzBack").addEventListener("click",function(){stopBlitz();openGames();});
  $("#memBack").addEventListener("click",function(){MEM.on=false;openGames();});
  $("#unoBack").addEventListener("click",function(){if(UNO)UNO.over=true;openGames();});
  $("#unoDraw").addEventListener("click",function(){if(!UNO||UNO.over||UNO.turn!=="p"||UNO.pendingWild)return;tone(320,.1);unoDrawN(UNO.player,1);renderUno();UNO.turn="c";$("#unoInfo").textContent="Du ziehst. Computer ist dran …";setTimeout(cpuUno,850);});
  Array.prototype.forEach.call(document.querySelectorAll("#unoColorPick .ucol"),function(btn){btn.addEventListener("click",function(){unoChooseColor(btn.getAttribute("data-c"));});});
  $("#schBack").addEventListener("click",function(){if(CH)CH.over=true;openGames();});
  Array.prototype.forEach.call(document.querySelectorAll("#schDiff button"),function(btn){btn.addEventListener("click",function(){chLevel=+btn.getAttribute("data-lv");startChess();});});
  $("#lvlBack").addEventListener("click",enterHome);
  $("#backBtn").addEventListener("click",function(){openLevels(state?state.key:curGame);});
  $("#homeBtn").addEventListener("click",function(){SCHOOL.on=false;enterHome();});
  $("#againBtn").addEventListener("click",function(){if(SCHOOL.on){var last=SCHOOL.idx>=SCHOOL.lessons.length-1;if(last){showZeugnis();}else schoolAdvance();}else startGame();});
  $("#schoolBtn").addEventListener("click",startSchool);
  var schoolBtn2=$("#schoolBtn2");if(schoolBtn2)schoolBtn2.addEventListener("click",startSchool);
  var gamesEntry=$("#gamesEntry");if(gamesEntry)gamesEntry.addEventListener("click",openGames);
  Array.prototype.forEach.call(document.querySelectorAll("#homeTabs .tab"),function(tb){tb.addEventListener("click",function(){
    Array.prototype.forEach.call(document.querySelectorAll("#homeTabs .tab"),function(x){x.classList.toggle("on",x===tb);});
    var t=tb.getAttribute("data-tab");$("#tab-learn").hidden=(t!=="learn");$("#tab-more").hidden=(t!=="more");});});
  $("#schoolBack").addEventListener("click",enterHome);
  $("#schoolStart").addEventListener("click",schoolBegin);
  var chestBtn=$("#chestBtn");if(chestBtn)chestBtn.addEventListener("click",openChest);
  $("#chestBack").addEventListener("click",enterHome);
  $("#chestOpen").addEventListener("click",doOpenChest);
  var petBtn=$("#petBtn");if(petBtn)petBtn.addEventListener("click",openPet);
  $("#petBack").addEventListener("click",enterHome);
  $("#petPet").addEventListener("click",petStreichel);
  $("#zeugBack").addEventListener("click",enterHome);
  $("#zeugDone").addEventListener("click",enterHome);
  (function(){var bigBtn=$("#bigBtn");if(!bigBtn)return;function upd(){bigBtn.textContent="Große Schrift: "+(load("antona_big",false)?"An":"Aus");}
    bigBtn.addEventListener("click",function(){save("antona_big",!load("antona_big",false));applyBig();upd();});upd();})();
  $("#speakBtn").addEventListener("click",function(){if(state&&state.current)speak(state.current.speak,state.current.speakLang);});
  $("#whoBtn").addEventListener("click",function(){renderProfiles();show("profiles");});
  $("#parentBtn").addEventListener("click",openParent);
  $("#parentBack").addEventListener("click",enterHome);

  /* Design-Umschalter (3 Designs) */
  var SKINS=["premium","pro","neon","soft","sunny"],SKIN_NAME={premium:"Premium (modern)",pro:"Pro (hell, App-Look)",neon:"Neon (dunkel)",soft:"Soft (hell)",sunny:"Sonnig (warm)"};
  function applySkin(s){if(SKINS.indexOf(s)<0)s="pro";document.documentElement.setAttribute("data-skin",s);}
  var toastEl=null,toastT=0;
  function toast(msg){if(!toastEl){toastEl=document.createElement("div");toastEl.className="toast";document.body.appendChild(toastEl);}
    toastEl.textContent=msg;toastEl.classList.add("on");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("on");},1500);}
  var skinBtn=$("#themeBtn");skinBtn.textContent="🎨";skinBtn.title="Design wechseln";skinBtn.setAttribute("aria-label","Design wechseln");
  applySkin(load("antona_skin","premium"));applyBig();
  skinBtn.addEventListener("click",function(){
    var cur=load("antona_skin","premium"),nx=SKINS[(SKINS.indexOf(cur)+1)%SKINS.length];
    save("antona_skin",nx);applySkin(nx);toast("Design: "+SKIN_NAME[nx]);
  });

  /* Start */
  drawMascot("idle");
  renderProfiles();
  if(active())enterHome();else show(profiles.length?"profiles":"newProfile");
})();
