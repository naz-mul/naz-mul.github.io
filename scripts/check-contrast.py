import math, re, sys
def lin(L,C,H):
    h=math.radians(H); a,b=C*math.cos(h), C*math.sin(h)
    l_=L+0.3963377774*a+0.2158037573*b; m_=L-0.1055613458*a-0.0638541728*b; s_=L-0.0894841775*a-1.2914855480*b
    l,m,s=l_**3,m_**3,s_**3
    return (4.0767416621*l-3.3077115913*m+0.2309699292*s,
            -1.2684380046*l+2.6097574011*m-0.3413193965*s,
            -0.0041960863*l-0.7034186147*m+1.7076147010*s)
def enc(x):
    x=max(0.0,min(1.0,x)); return 12.92*x if x<=0.0031308 else 1.055*(x**(1/2.4))-0.055
def srgb(c): return [enc(v) for v in lin(*c)]
def in_gamut(c,tol=1e-3): return all(-tol<=v<=1+tol for v in lin(*c))
def rl(rgb):
    f=lambda v: v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b=[f(x) for x in rgb]; return 0.2126*r+0.7152*g+0.0722*b
def ratio(a,b):
    L1,L2=rl(srgb(a)),rl(srgb(b)); hi,lo=max(L1,L2),min(L1,L2); return (hi+0.05)/(lo+0.05)

css=open('src/styles/globals.css').read()
def block(pat):
    m=re.search(pat, css, re.S); return m.group(1) if m else ''
def toks(txt):
    d={}
    for name,L,C,H in re.findall(r'--([a-z-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)', txt):
        d[name]=(float(L),float(C),float(H))
    return d
light=toks(block(r':root \{(.*?)\n\}'))
dark =toks(block(r':root\.dark \{(.*?)\n\}'))
pairs=[('body text','foreground','background',4.5),
       ('secondary text','muted-foreground','background',4.5),
       ('mono labels','faint-foreground','background',4.5),
       ('accent links','accent','background',4.5),
       ('accent on sunken','accent','surface-sunken',4.5),
       ('body on sunken','foreground','surface-sunken',4.5),
       ('body on surface','foreground','surface',4.5)]
fails=0
for nm,t in (('LIGHT',light),('DARK',dark)):
    print(f"\n=== {nm} ===")
    for label,fg,bg,need in pairs:
        if fg not in t or bg not in t: print(f"  ??   missing {fg}/{bg}"); continue
        r=ratio(t[fg],t[bg]); ok=r>=need
        fails += 0 if ok else 1
        print(f"  {'PASS' if ok else 'FAIL'}  {r:5.2f}:1 (need {need})  {label}")
    oog=[k for k,v in t.items() if not in_gamut(v)]
    if oog: fails+=1
    print(f"  gamut: {'all inside sRGB' if not oog else 'OUT OF GAMUT '+str(oog)}")
print(f"\n{'ALL CHECKS PASS' if fails==0 else str(fails)+' FAILURES'}")
sys.exit(1 if fails else 0)
