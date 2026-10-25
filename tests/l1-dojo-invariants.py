from pathlib import Path
import re,subprocess,json,hashlib
p='level1/index.html';base=subprocess.check_output(['git','show','6f2fa87:'+p]).decode();new=Path(p).read_text()
# Compare exact story functions, data objects, and immutable media references.
def function(source,name):
 start=source.index('function '+name+'(');m=re.search(r'\n(?:function |// [═─🎬🍵🪜⭐]|const |let |document\.)',source[start+1:]);return source[start:start+1+m.start()] if m else ''
names=['aiLines','MAP_NORMAL','MAP_MASTER']
protected=['subtitleContent','updateSubtitle','actCold','handoffToPlayer','showFaceSlap','showGarciaReveal','showStory','makeChoice','teaRewardHTML','renderStars','loadBestStars','saveBestStars','playFootstep','playRescueSound','playVictorySound']
checks={name:function(base,name)==function(new,name) for name in protected}
for name in names:
 pattern=r'const '+name+r' = \{[\s\S]*?\n\};';checks[name]=re.search(pattern,base).group()==re.search(pattern,new).group()
for name in ['getStars','showChallengeResult']:
 old=function(base,name);updated=function(new,name).replace('gameState.raceOptimal ?? (gameState.hardMode ? MAP_MASTER.saveOptimal : 12)', 'gameState.hardMode ? MAP_MASTER.saveOptimal : 12')
 checks[name+' story text unchanged']=old==updated
pattern=r'window.jokAnalytics = \(function\(level\) \{[\s\S]*?jokAnalytics.abandon\(\)\);'
checks['GA4 lifecycle byte-identical']=re.search(pattern,base).group()==re.search(pattern,new).group()
checks['existing hint event byte-identical']="jokAnalytics.event('l1_hint_astar');" in new and function(base,'watchAStar')==function(new,'watchAStar')
media=lambda s:sorted(re.findall(r'(?:src=[\"\']|url\([\"\']?)([^\"\'\s)>]+\.(?:png|jpg|jpeg|mp3|mp4))',s))
checks['media paths unchanged']=media(base)==media(new)
checks['stable mobile reference untouched']=not subprocess.check_output(['git','diff','--','level1/level1_STABLE_手機OK.html']).strip()
checks['homepage, other levels and outro untouched']=not subprocess.check_output(['git','diff','--','index.html','level2','level3','level4','level5','level6','level7','level8','outro']).strip()
print(json.dumps(checks,ensure_ascii=False,indent=2))
Path('docs/JOK_SPEC_03/invariants-results.json').write_text(json.dumps({'baseline':'6f2fa87','checks':checks,'authorizedExceptions':['01d portico quote-card language tags and single attribution','01d replay/home buttons with music stop','old rung-menu replaced','stars and race result optimal benchmark use daily map','timer invalidation on leaving the portico']},ensure_ascii=False,indent=2)+'\n')
assert all(checks.values())
