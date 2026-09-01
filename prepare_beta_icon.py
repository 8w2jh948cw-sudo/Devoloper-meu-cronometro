from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
SRC=ROOT/'app-icon-192.png'
OUT=ROOT/'app-icon-beta-192.png'

if not SRC.exists():
    raise SystemExit('app-icon-192.png ausente')

img=Image.open(SRC).convert('RGBA')
w,h=img.size
if (w,h)!=(192,192):
    img=img.resize((192,192),Image.Resampling.LANCZOS)

# Tag BETA discreta no canto inferior direito, inspirada no esquema do Registro Mental.
draw=ImageDraw.Draw(img,'RGBA')
pill=(103,145,185,181)
radius=18
# sombra curta + cápsula violeta
draw.rounded_rectangle((101,147,187,183),radius=radius,fill=(35,20,80,68))
draw.rounded_rectangle(pill,radius=radius,fill=(108,62,225,245),outline=(210,191,255,185),width=1)

try:
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',22)
except Exception:
    font=ImageFont.load_default()
text='BETA'
bbox=draw.textbbox((0,0),text,font=font,stroke_width=0)
tw,th=bbox[2]-bbox[0],bbox[3]-bbox[1]
x=(pill[0]+pill[2]-tw)/2
y=(pill[1]+pill[3]-th)/2-bbox[1]-1
draw.text((x,y),text,font=font,fill=(255,255,255,255))
img.save(OUT,'PNG',optimize=True)

# validação: reabre e carrega tudo para detectar PNG truncado antes do build
check=Image.open(OUT);check.load()
if check.size!=(192,192):
    raise SystemExit('Ícone Beta gerado com dimensão incorreta')
print(f'Ícone Beta válido gerado: {OUT.name} · {OUT.stat().st_size} bytes')
