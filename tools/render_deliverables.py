"""Render a factual case study and an animated walkthrough from actual engine output.
Usage: python3 tools/render_deliverables.py /absolute/output/directory
Requires Pillow, reportlab and ffmpeg. No browser screen recording is implied.
"""
from pathlib import Path
import json, sys, math, subprocess
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'output'); OUT.mkdir(parents=True,exist_ok=True)
TMP=OUT/'previews'; TMP.mkdir(exist_ok=True)
DATA=json.loads((ROOT/'docs/Demo_Data.json').read_text())
URL='https://orderly-bakery-workbench.ablecod4.chatgpt.site'
FONT='/usr/share/fonts/truetype/dejavu/'
GREEN='#214e40'; INK='#283e34'; CREAM='#f7f5ed'; SAGE='#e7eddf'; MUTED='#7b8c73'; LINE='#dbe2d2'; ORANGE='#bd7444'; WHITE='#fffef8'
for name,file in [('Sans','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf')]:pdfmetrics.registerFont(TTFont(name,FONT+file))

def case_study():
 c=canvas.Canvas(str(OUT/'Orderly_Case_Study.pdf'),pagesize=(595.28,841.89))
 c.setTitle('Orderly - Prototype Case Study'); c.setAuthor('Orderly project; builder attribution pending')
 page=0
 def para(text,x,y,w=493,size=10.5,leading=16,color=INK,font='Sans'):
  p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=colors.HexColor(color),spaceAfter=0))
  aw,h=p.wrap(w,800)
  if y-h<52: raise ValueError(f'Page {page} overflow: {text[:60]} y={y-h}')
  p.drawOn(c,x,y-h);return y-h
 def start(label,title):
  nonlocal page
  if page:c.showPage()
  page+=1;c.setFillColor(colors.HexColor(CREAM));c.rect(0,0,596,842,fill=1,stroke=0)
  c.setFillColor(colors.HexColor(GREEN));c.setFont('Serif',21);c.drawString(51,788,'orderly')
  c.setFont('Sans',8);c.setFillColor(colors.HexColor(MUTED));c.drawRightString(544,792,'PROTOTYPE CASE STUDY / 10 OCT 2026')
  c.setStrokeColor(colors.HexColor(LINE));c.line(51,770,544,770)
  c.setFont('Bold',8);c.setFillColor(colors.HexColor(ORANGE));c.drawString(51,739,label.upper())
  y=para(title,51,716,size=29,leading=35,font='Serif')
  c.setStrokeColor(colors.HexColor(LINE));c.line(51,43,544,43);c.setFont('Sans',7.5);c.setFillColor(colors.HexColor(MUTED));c.drawString(51,29,'Orderly | Fictional examples; customer validation pending');c.drawRightString(544,29,f'{page:02d} / 05')
  return y-25
 def heading(t,y):return para(t,51,y,size=14,leading=21,font='Bold',color=GREEN)-8
 def body(t,y):return para(t,51,y)-17
 def table(rows,widths,y):
  cells=[[Paragraph(str(v),ParagraphStyle('t',fontName='Bold' if i==0 else 'Sans',fontSize=9,leading=13,textColor=colors.HexColor(GREEN if i==0 else INK))) for v in row] for i,row in enumerate(rows)]
  t=Table(cells,colWidths=widths,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor(SAGE)),('BACKGROUND',(0,1),(-1,-1),colors.HexColor(WHITE)),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor(LINE))]))
  _,h=t.wrap(493,800)
  if y-h<52:raise ValueError(f'Table overflow page {page}: {y-h}')
  t.drawOn(c,51,y-h);return y-h-20
 y=start('01 / The project','A calmer desk for<br/>a busy kitchen.')
 y=body('Orderly turns a pasted customer message into a reviewed bakery order and a combined preparation list. It is a small, functioning browser app built for an easy-to-understand demonstration.',y)
 y=heading('Problem hypothesis',y)
 y=body('Independent bakers may spend time copying quantities, dates and prices from chats into a notebook or spreadsheet. Amendments and incomplete messages may introduce errors. These are hypotheses for customer interviews, not verified research findings.',y)
 y=heading('First customer to test with',y)
 y=body('An independent home baker who personally handles chat orders and kitchen planning. The pilot should use anonymized orders and the baker\'s real menu, with permission.',y)
 y=table([['What is working','Current boundary'],['Message parsing, review form, price totals','English text and known menu products'],['Order book and kitchen preparation list','One browser profile; no shared cloud database'],['Reply draft, CSV and JSON backup','Manual copy/send; no messaging or payments'],['Configurable menu and prices','Per-piece INR prices; fees and taxes separate']],[247,246],y)
 y=body('<b>Product claim:</b> a working prototype ready for customer testing. It uses deterministic local text rules, not a language model. No customer traction or time savings are claimed.',y)
 y=start('02 / The demonstration','One message becomes<br/>a checked order.')
 y=body('<b>Fictional message:</b> “Hi, I\'m Ananya. Can I get 6 choco chip cookies and 4 brownies for tomorrow at 5 pm? Pickup please.”',y)
 y=body('With the message date set to 10 October 2026, the parser returns 11 October 2026, 17:00, Pickup. The reference date is editable so an older message does not silently use today.',y)
 y=table([['Menu item','Quantity','Unit price','Amount'],['Choco chip cookie','6','INR 65','INR 390'],['Brownie','4','INR 90','INR 360'],['Items total','','','INR 750']],[208,65,105,115],y)
 y=heading('The review is part of the workflow',y)
 y=body('The user checks the extracted details, fills gaps, confirms the review checkbox and saves. The saved order contains a snapshot of the item prices. Updating the menu does not rewrite earlier orders.',y)
 y=body('A request such as “a box of brownies” leaves the piece quantity blank. Repeated products, changed wording and dietary requests trigger checks. The parser can still miss unusual language, so every draft needs manual review.',y)
 y=heading('Kitchen preparation',y)
 y=body('The preparation list groups active orders by date and product. Ready orders remain visible until completed, while the “to bake” column excludes ready quantities. Completed orders leave the active preparation list.',y)
 y=start('03 / Implementation and checks','Simple enough to explain.<br/>Useful enough to test.')
 y=body('The application uses buildless HTML, CSS and JavaScript modules. The pure order logic is separate from the interface. Browser localStorage holds the menu and saved orders. CSV and JSON exports provide a portable copy.',y)
 y=table([['Check area','Observed result'],['Menu quantities and price arithmetic','6 cookies + 4 brownies = INR 750'],['Incomplete and revised requests','Missing quantities and changes are flagged'],['Dates and fulfilment','Invalid days rejected; delivery requires an address'],['Preparation aggregation','Completed excluded; ready counted separately'],['CSV and price snapshots','Formula-like input escaped; earlier prices retained'],['Automated core test suite','14 checks passed'],['Optional n8n workflow code','Embedded JavaScript executed locally; expected output verified']],[204,289],y)
 y=heading('What the checks do not establish',y)
 y=body('Full browser interaction and screenshot QA were unavailable in this session. The n8n JSON has not been imported into a live n8n instance. Customer usability, parsing accuracy on real messages, dietary suitability and business impact remain unverified.',y)
 y=heading('Privacy and operating limits',y)
 y=body('Message content stays in the browser application. The host serves the page and may handle normal access logs. A shared browser profile can access its local records. Clearing browser data removes records unless backed up. Saved order content currently requires deletion and recreation to correct.',y)
 y=start('04 / Validation plan','A prototype is the start<br/>of the evidence.')
 y=table([['Evidence','Actual status','Target / next step'],['Customer interviews','0 verified','20+ interviews from the roadmap'],['Pilot commitments','0 signed','5 actual pilot commitments'],['Wait-list','No verified signups','25 by Day 10'],['Customer time savings','Not measured','Paired baseline and tool timing'],['Customer outreach','Not performed','Share evidence-backed material with prospects']],[149,151,193],y)
 y=heading('The 14-day sequence',y)
 y=body('<b>Days 0-2:</b> define the customer, build a discovery pipeline, interview and cluster pain points. <b>Days 3-6:</b> revise the MVP, measure the task and seek genuine pilot commitments. <b>Days 7-10:</b> publish a landing page and useful evidence, then test distribution. <b>Days 11-14:</b> run approved outreach, demonstrate to pilots, review results and present.',y)
 y=body('The supplied roadmap also requests a 49-page report/KDP link, 19 directory submissions, three community posts and a 100-email campaign. Those need real research, audience fit and authorized publication. Templates are included; these activities are not claimed as completed.',y)
 y=heading('Measurement and decision gates',y)
 y=body('Time five anonymized orders per participant, include corrections, and compare median seconds to a correct result with the existing method. Track repeat use a week later. The source gates are fewer than 3 signed LOIs by Day 6 and fewer than 25 wait-list signups by Day 10. Do not replace missing outcomes with estimates.',y)
 y=body('<b>Scheduling note:</b> the source suggests about 3 hours daily, but 20 interviews of 15 minutes total 5 hours before notes. Spread calls across a team or allow extra time.',y)
 y=start('05 / Submission handoff','Show the product.<br/>Keep the story honest.')
 y=table([['Deliverable','Prepared result'],['Live project','Public Orderly browser app'],['Source / workflow','Complete source plus downloadable n8n workflow JSON'],['Demo','90-second captioned animated walkthrough, using actual engine output and fictional orders'],['Case study','This implementation record and validation plan'],['Pitch','Six sections: problem, solution, demo, traction, build journey, team'],['GTM materials','Interview guide, evidence logs, pilot-interest form, check-ins and execution plan']],[140,353],y)
 y=body('The video is an animated walkthrough, not a recording of browser interaction or a customer testimonial. Use the live app during the presentation, and keep the MP4 as an offline backup. If the evaluator requires screen capture, record the included script against the live app.',y)
 y=heading('Submission links',y)
 y=body('The submission form accepts a GitHub repository or workflow JSON. Use the downloadable JSON for that field. The demo and this case study are hosted alongside the public application. Customer research and measured outcomes remain next steps.',y)
 y=body(f'<b>Live project:</b> <link href="{URL}" color="{GREEN}">Open Orderly</link><br/><font size="8">{URL}</font><br/><link href="{URL}/workflow.json" color="{GREEN}">Workflow JSON</link> | <link href="{URL}/demo.mp4" color="{GREEN}">Demo video</link> | <link href="{URL}/case-study.pdf" color="{GREEN}">Case study</link>',y)
 y=heading('Sources and reproducibility',y)
 y=para('Source briefs: <i>14-Day GTM Roadmap(2).pdf</i>, pp. 1-3, and <i>100xEngineers _ Pitch Template(2).pdf</i>, pp. 1, 3-4. Implementation evidence: the supplied source, 14 core checks and the saved sample workflow output. n8n reference documentation was consulted on 10 October 2026; links are in README.md.',51,y,size=8.5,leading=13)
 c.save();print('Case study rendered',flush=True)

W,H=1920,1080
def font(size,serif=False,bold=False):return ImageFont.truetype(FONT+('DejaVuSerif.ttf' if serif else ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),size)
def wrapped(draw,text,xy,width,size=28,color=INK,leading=None,serif=False,bold=False):
 x,y=xy;f=font(size,serif,bold);lh=leading or int(size*1.5)
 for paragraph in str(text).split('\n'):
  line=''
  for word in paragraph.split():
   trial=(line+' '+word).strip()
   if draw.textlength(trial,font=f)>width and line:draw.text((x,y),line,font=f,fill=color);y+=lh;line=word
   else:line=trial
  draw.text((x,y),line,font=f,fill=color);y+=lh
 return y
def base(n,label,title,sub=''):
 im=Image.new('RGB',(W,H),CREAM);d=ImageDraw.Draw(im)
 d.text((90,44),'orderly',font=font(44,True),fill=GREEN)
 d.text((W-510,63),'GUIDED DEMO  /  SAMPLE DATA',font=font(18),fill=MUTED)
 d.line((90,124,W-90,124),fill=LINE,width=2)
 d.text((92,167),label.upper(),font=font(20,bold=True),fill=ORANGE)
 y=wrapped(d,title,(90,222),1740,size=70,serif=True,leading=88)
 if sub:wrapped(d,sub,(94,y+22),1720,size=25,color=MUTED)
 d.text((94,H-67),f'{n:02d} / 08',font=font(18),fill=MUTED)
 d.text((190,H-67),'Animated walkthrough using output from the working parser.',font=font(18),fill=MUTED)
 return im,d
def box(d,xy,fill=WHITE,outline=LINE):d.rounded_rectangle(xy,radius=18,fill=fill,outline=outline,width=2)
def scenes():
 out=[]
 im,d=base(1,'A LITTLE LESS ADMIN','A calmer desk\nfor a busy kitchen.','Orderly helps independent bakers turn customer messages into checked orders.')
 d.rounded_rectangle((94,570,1800,880),radius=20,fill=GREEN)
 d.text((145,618),'PASTE A MESSAGE',font=font(22,bold=True),fill='#bbceb1')
 d.text((690,618),'REVIEW THE ORDER',font=font(22,bold=True),fill='#bbceb1')
 d.text((1260,618),'PLAN THE BAKING',font=font(22,bold=True),fill='#bbceb1')
 d.text((145,698),'01',font=font(100,True),fill='#fff0cb');d.text((690,698),'02',font=font(100,True),fill='#fff0cb');d.text((1260,698),'03',font=font(100,True),fill='#fff0cb');out.append(im)
 im,d=base(2,'01 / MESSAGE DESK','Start with the customer message.','Paste one order at a time. Set the date the message was sent.')
 box(d,(93,405,1825,872));d.text((140,449),'FICTIONAL CUSTOMER MESSAGE',font=font(20,bold=True),fill=MUTED)
 wrapped(d,DATA['orders'][0]['source'],(140,525),1610,size=43,leading=67,serif=True)
 d.line((140,730,1775,730),fill=LINE,width=2);d.text((140,770),'Message date: 10 October 2026',font=font(26),fill=MUTED)
 d.rounded_rectangle((1290,761,1775,826),radius=9,fill=GREEN);d.text((1330,776),'Create order draft  ↗',font=font(25,bold=True),fill=WHITE);out.append(im)
 im,d=base(3,'02 / CHECK THE DETAILS','A clear order. A checked total.','The menu supplies the prices. You make the final check.')
 box(d,(94,403,1194,915));box(d,(1230,403,1826,915),fill=SAGE)
 for x,t in [(135,'PRODUCT'),(705,'QTY'),(880,'AMOUNT')]:d.text((x,440),t,font=font(18,bold=True),fill=MUTED)
 for idx,item in enumerate(DATA['orders'][0]['items']):
  y=505+idx*110;d.text((135,y),item['name'],font=font(31),fill=INK);d.text((707,y),str(item['qty']),font=font(36,True),fill=GREEN);d.text((885,y),'₹'+str(item['qty']*item['price']),font=font(36,True),fill=GREEN);d.line((135,y+77,1145,y+77),fill=LINE,width=2)
 d.text((135,762),'ITEMS TOTAL',font=font(22,bold=True),fill=MUTED);d.text((870,745),'₹750',font=font(70,True),fill=GREEN)
 d.text((135,851),'Delivery fees and taxes excluded',font=font(20),fill=MUTED)
 d.text((1275,442),'ANANYA',font=font(23,bold=True),fill=GREEN)
 wrapped(d,'11 October 2026\n17:00\nPickup',(1275,510),485,size=36,leading=64,serif=True)
 wrapped(d,'Check the original message before saving.',(1275,775),440,size=25,color=MUTED);out.append(im)
 im,d=base(4,'REVIEW MATTERS','A missing detail stays missing.','Orderly highlights uncertainty instead of assigning a box size.')
 box(d,(94,405,900,901));box(d,(940,405,1826,901),fill='#fff0d6',outline='#ebd7b4')
 d.text((137,452),'ANOTHER SAMPLE MESSAGE',font=font(18,bold=True),fill=MUTED)
 wrapped(d,'“Can I get a box of brownies and 4 oat cookies? Delivery please.”',(137,525),710,size=42,serif=True,leading=66)
 d.text((985,452),'DETAILS TO CHECK',font=font(23,bold=True),fill='#986b33')
 for i,t in enumerate(['Brownies: confirm piece quantity','Customer name and due date','Pickup or delivery time','Delivery address']):d.text((985,533+i*76),'• '+t,font=font(27),fill='#986b33')
 out.append(im)
 im,d=base(5,'03 / ORDER BOOK','Keep the work moving.','Three fictional orders, each with a clear next step.')
 for idx,o in enumerate(DATA['orders']):
  x=94+idx*590;box(d,(x,414,x+552,907));d.text((x+34,449),o['code']+' / SAMPLE',font=font(18),fill=MUTED)
  d.text((x+34,505),o['customer'],font=font(43,True),fill=GREEN)
  d.rounded_rectangle((x+34,582,x+230,632),radius=8,fill=SAGE);d.text((x+52,591),o['status'],font=font(22,bold=True),fill=GREEN)
  for j,it in enumerate(o['items']):wrapped(d,f"{it['qty']} × {it['name']}",(x+34,669+j*65),480,size=24,leading=34)
  d.line((x+34,818,x+515,818),fill=LINE,width=2);d.text((x+34,839),'Pickup · '+o['time'],font=font(23),fill=MUTED)
 out.append(im)
 im,d=base(6,'04 / KITCHEN PREP','Know exactly what to bake.','Active orders grouped by product for 11 October 2026.')
 box(d,(94,411,1826,922))
 for x,t in [(137,'PRODUCT'),(970,'TOTAL PIECES'),(1330,'TO BAKE')]:d.text((x,450),t,font=font(20,bold=True),fill=MUTED)
 for j,r in enumerate(DATA['prep']):
  y=520+j*89;d.text((137,y),r['name'],font=font(29),fill=INK);d.text((1000,y-4),str(r['qty']),font=font(44,True),fill=GREEN);d.text((1350,y-4),str(r['needsBaking']),font=font(44,True),fill=ORANGE)
  if j<3:d.line((137,y+70,1770,y+70),fill=LINE,width=1)
 d.text((100,951),'Ready quantities stay visible. Completed orders leave the active prep list.',font=font(23),fill=MUTED);out.append(im)
 im,d=base(7,'05 / A CLEAN HANDOFF','Your prices. Your final say.','Check the confirmation draft before copying it into your customer chat.')
 box(d,(94,403,1826,764));wrapped(d,DATA['reply'],(139,448),1620,size=31,leading=49)
 for x,t in [(94,'EDIT YOUR MENU'),(684,'EXPORT ORDERS'),(1274,'BACK UP YOUR WORK')]:
  box(d,(x,812,x+550,927),fill=SAGE);d.text((x+28,852),t,font=font(23,bold=True),fill=GREEN)
 out.append(im)
 im,d=base(8,'BUILT TO TEST WITH REAL BAKERS','Orderly. Ready for a first pilot.','A working prototype with local text rules. No paid API key needed.')
 d.rounded_rectangle((94,429,1826,780),radius=20,fill=GREEN)
 d.text((144,482),'WHAT IS REAL TODAY',font=font(21,bold=True),fill='#bacdae')
 wrapped(d,'Working order logic.\n14 passing automated core checks.',(144,535),1630,size=52,serif=True,leading=77,color=WHITE)
 d.text((146,713),'Customer interviews, signed pilots and impact measurements are still pending.',font=font(25),fill='#c8d8bf')
 d.text((96,838),'LIVE REVIEW VERSION',font=font(19,bold=True),fill=ORANGE)
 d.text((96,891),URL,font=font(28),fill=GREEN);out.append(im)
 return out

def video():
 images=scenes()
 for i,im in enumerate(images):im.save(TMP/f'demo_scene_{i+1}.png')
 durations=[8,13,13,11,12,13,11,9];fps=15;total_sec=sum(durations)
 cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart','-threads','4',str(OUT/'Orderly_Demo.mp4')]
 process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 elapsed=0
 for idx,(im,dur) in enumerate(zip(images,durations)):
  for k in range(dur*fps):
   t=k/fps
   if idx and t<.6:frame=Image.blend(images[idx-1],im,t/.6)
   else:frame=im.copy()
   d=ImageDraw.Draw(frame);d.rectangle((0,H-6,int(W*(elapsed+t)/total_sec),H),fill=ORANGE)
   process.stdin.write(frame.tobytes())
  elapsed+=dur;print(f'Video scene {idx+1}/8 complete',flush=True)
 process.stdin.close()
 if process.wait()!=0:raise RuntimeError('ffmpeg failed')
 captions=[('Orderly: a calmer desk for a busy kitchen.','Animated walkthrough using fictional sample orders.'),('Paste a customer message.','Set the date the message was sent.'),('6 choco chip cookies + 4 brownies = INR 750.','Check quantities, date, time and pickup method.'),('A box has no assumed size.','Review missing quantities and customer details.'),('Track orders through New, Baking, Ready and Completed.','These are fictional examples.'),('The kitchen list combines quantities across active orders.','Ready items are excluded from the to-bake count.'),('Review and copy a confirmation draft.','Export orders or download a backup.'),('A working rules-based prototype with 14 core checks.','Customer validation and measured impact are still pending.')]
 def stamp(s):return f'{s//3600:02d}:{s//60%60:02d}:{s%60:02d},000'
 srt=[];elapsed=0
 for i,(dur,lines) in enumerate(zip(durations,captions),1):srt.append(f'{i}\n{stamp(elapsed)} --> {stamp(elapsed+dur)}\n'+ '\n'.join(lines)+'\n');elapsed+=dur
 (OUT/'Orderly_Demo_Captions.srt').write_text('\n'.join(srt))
 print('90-second MP4 complete',flush=True)

if __name__ == '__main__':
 case_study()
 video()
