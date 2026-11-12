(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HandCsv=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function quote(value){let s=String(value);if(/^[\s\uFEFF]*[=+@-]/u.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
 function records(history){const rows=[['Hand','Winner','Points earned','Victory','Match','Completed UTC'],...history.map(r=>[r.hand,r.winner,r.points,r.reason,r.match,new Date(r.time).toISOString()])];return '\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');}
 return {quote,records};
});
