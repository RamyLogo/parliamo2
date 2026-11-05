from playwright.sync_api import sync_playwright
import os
from pathlib import Path
# Run against a local server: python3 -m http.server 8000
# Requires Python Playwright and Chromium. No app data is saved by these tests.
URL=os.environ.get('PARLIAMO_TEST_URL','http://127.0.0.1:8000')
ROOT=Path(__file__).resolve().parents[1]
def state(page):
 return page.evaluate('({key:gameScene?.gameKey,green:gameGreen,orange:gameOrange,red:gameRed,assisted:gameAssisted,running:gameRunning,turn:gameTurn})')
def answer(page,correct=True):
 page.evaluate('sentence=gameExpected.map(x=>({...x}));renderSentence()' if correct else 'sentence=[];renderSentence()')
 page.locator('#gameVerifyCompact').click()
def advance(page):
 page.evaluate('nextGame()')
def prepare(page,mode='immediate',count=3):
 page.evaluate('''({mode,count})=>{
 if(gameActive)toggleGame();
 scenesData=[{label:'il bimbo',gameKey:'a',gameEnabled:true,image:'icon-192.png'}, {label:'mangia',gameKey:'b',gameEnabled:true,image:'icon-192.png'}, {label:'la pizza',gameKey:'c',gameEnabled:true,image:'icon-192.png'}].slice(0,count);
 document.getElementById('gameRepeatMode').value=mode;saveGameRepeatMode();
 Math.random=()=>0;toggleGame();nextGame();
 }''',{'mode':mode,'count':count})
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(1440,900),(390,844),(320,568),(844,390)]:
  page=browser.new_page(viewport={'width':width,'height':height},is_mobile=width<900,has_touch=width<900);errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto(URL,wait_until='domcontentloaded')
  # No external network dependency in interaction/layout tests.
  page.route('https://static.arasaac.org/**',lambda route:route.fulfill(path=str(ROOT/'icon-192.png'),content_type='image/png'))
  page.locator('#board .card').first.click();page.locator('#board .card').first.click()
  dims=page.locator('#sentence .token').first.bounding_box()
  pic=page.locator('#board .card > img').first.bounding_box()['height']
  page.locator('#boardLarger').click()
  assert page.locator('#board .card > img').first.bounding_box()['height']>pic
  newdims=page.locator('#sentence .token').first.bounding_box()
  assert dims['width']==newdims['width'] and dims['height']==newdims['height']
  assert page.locator('#sentence button').count()==0
  page.evaluate('toggleEditMode()');assert page.locator('#sentence button').count()==3
  page.locator('#sentence button[aria-label="Elimina pittogramma dalla frase"]').click()
  assert page.locator('#sentence .token').count()==0
  page.evaluate('toggleEditMode();goBack();data.root.push(...Array.from({length:50},(_,i)=>({type:"pic",label:"test "+i,id:7176})));render()')
  before=page.locator('#sentence').bounding_box();top=page.locator('.topbar').bounding_box()
  page.locator('main').evaluate('(el)=>el.scrollTop=el.scrollHeight')
  assert page.locator('main').evaluate('(el)=>el.scrollTop')>0
  assert before==page.locator('#sentence').bounding_box() and top==page.locator('.topbar').bounding_box()
  page.reload(wait_until='domcontentloaded');assert page.locator('#boardSize').inner_text()=='115%'
  # Immediate assisted repeat, followed by delayed independent review.
  prepare(page)
  assert state(page)['key']=='a'
  answer(page,False);answer(page,False)
  assert page.locator('#gameSolution').is_visible() and state(page)['red']==2
  assert page.locator('#gamePanel').evaluate('(el)=>el.scrollTop')==0
  page.screenshot(path=f'/tmp/parliamo-solution-{width}.png',full_page=True)
  page.locator('#gameNext').click();assert state(page)['key']=='a' and state(page)['assisted']
  answer(page);assert state(page)['orange']==1 and state(page)['green']==0
  advance(page);assert state(page)['key']=='b'
  answer(page);advance(page);assert state(page)['key']=='a' and not state(page)['assisted']
  answer(page);assert state(page)['orange']==0 and state(page)['green']==2
  advance(page);answer(page);advance(page)
  assert not state(page)['running'] and page.locator('#gameGreenCount').is_visible()
  # Delayed assisted repeat: another sentence intervenes.
  prepare(page,'delayed')
  answer(page,False);answer(page,False);page.locator('#gameNext').click()
  assert state(page)['key']=='b'
  answer(page);advance(page);assert state(page)['key']=='a' and state(page)['assisted']
  answer(page);assert state(page)['orange']==1
  advance(page);assert state(page)['key']=='c';answer(page);advance(page)
  assert state(page)['key']=='a' and not state(page)['assisted']
  answer(page,False);answer(page)
  assert state(page)['orange']==1 # first-attempt independence required
  advance(page);assert state(page)['key']=='b'
  answer(page);advance(page);assert state(page)['key']=='a'
  answer(page);assert state(page)['orange']==0
  advance(page);assert not state(page)['running']
  # A delayed retry of the last new phrase can reuse a completed phrase.
  prepare(page,'delayed',2);answer(page);advance(page)
  assert state(page)['key']=='b'
  answer(page,False);answer(page,False);page.locator('#gameNext').click()
  assert state(page)['key']=='a' and not state(page)['assisted']
  answer(page);assert state(page)['green']==1
  advance(page);assert state(page)['key']=='b' and state(page)['assisted']
  answer(page);assert state(page)['orange']==1
  advance(page);answer(page);advance(page);answer(page)
  assert state(page)['orange']==0 and state(page)['green']==2
  advance(page);assert not state(page)['running']
  # A single-scene session retries immediately and retains orange.
  prepare(page,'delayed',1);answer(page,False);answer(page,False);page.locator('#gameNext').click()
  assert state(page)['assisted'];answer(page);advance(page)
  assert state(page)['orange']==1 and not state(page)['running']
  # Test game scaling and scrolling with a populated board.
  prepare(page);page.evaluate('path=["root"];render()')
  old=page.locator('#board .folder-shell').first.bounding_box()['height']
  page.locator('#boardLarger').click();assert page.locator('#board .folder-shell').first.bounding_box()['height']>old
  assert page.locator('#gameOrangeRod').is_visible()
  verify_box=page.locator('#gameVerifyCompact').bounding_box()
  panel_box=page.locator('#gamePanel').bounding_box()
  assert verify_box['y']>=panel_box['y'] and verify_box['y']+verify_box['height']<=panel_box['y']+panel_box['height'],('verify clipped',width,verify_box,panel_box)
  page.screenshot(path=f'/tmp/parliamo-game-{width}.png',full_page=True)
  overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert not overflow,('horizontal overflow',width)
  sentence_box=page.locator('#sentence').bounding_box()
  assert sentence_box['y']>=0 and sentence_box['y']+sentence_box['height']<=height-100,('sentence clipped',width,sentence_box)
  assert page.locator('main').bounding_box()['height']>=100
  # Exercise the real automatic transition, without manually advancing.
  prepare(page,count=2);answer(page)
  page.wait_for_function("gameScene?.gameKey==='b'")
  assert state(page)['green']==1
  # The repeat setting survives a reload.
  page.reload(wait_until='domcontentloaded')
  assert page.locator('#gameRepeatMode').input_value()=='immediate'
  assert not errors,errors
  print(f'PASS {width}x{height}: resize, fixed controls, editing, both repeat modes, orange/green transfer, single scene, final scores, no JS errors')
  page.close()
 browser.close()
