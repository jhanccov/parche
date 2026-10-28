"""Genera el logo Parche en PNG: wordmark navy + spark amber."""
from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(OUT, "Nunito-ExtraBold.ttf")
NAVY = (10, 53, 86, 255)
AMBER = (245, 163, 0, 255)

def font_at(size):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([1000])  # peso Black en la variable
    except Exception:
        pass
    return f

def spark(draw, cx, cy, r, fill):
    # estrella de 4 puntas (concava, brazos gruesos)
    pts = []
    inner = r * 0.30
    for i in range(8):
        ang = math.pi / 2 + i * math.pi / 4
        rad = r if i % 2 == 0 else inner
        pts.append((cx + rad * math.cos(ang) * 0.82, cy - rad * math.sin(ang)))
    draw.polygon(pts, fill=fill)

def render(width_px, path, pad_ratio=0.12):
    size = int(width_px * 0.42)
    f = font_at(size)
    text = "parche"
    bbox = f.getbbox(text)  # (x0, y0, x1, y1)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    spark_r = int(size * 0.34)
    W = int(tw + spark_r * 1.1 + width_px * pad_ratio * 2)
    H = int(th + spark_r * 0.9 + width_px * pad_ratio * 2)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = int(width_px * pad_ratio) - bbox[0]
    y = int(width_px * pad_ratio) + spark_r * 0.35 - bbox[1]
    d.text((x, y), text, font=f, fill=NAVY)
    # spark montado sobre la "e": anclado al borde real de tinta
    ink = img.getbbox() or (x, y, x + tw, y + th)
    spark(draw=d, cx=ink[2] - spark_r * 0.15, cy=ink[1] + spark_r * 0.45, r=spark_r, fill=AMBER)
    # recorte al contenido + margen
    box = img.getbbox() or (0, 0, W, H)
    m = int(width_px * 0.03)
    box = (max(0, box[0] - m), max(0, box[1] - m), min(W, box[2] + m), min(H, box[3] + m))
    img = img.crop(box)
    # escalar al ancho pedido
    w0, h0 = img.size
    h1 = round(h0 * width_px / w0)
    img = img.resize((width_px, h1), Image.LANCZOS)
    img.save(path)
    print("ok:", path, img.size)

if __name__ == "__main__":
    render(1024, os.path.join(OUT, "logo-parche.png"))
    render(512, os.path.join(OUT, "logo-parche-512.png"))
    render(192, os.path.join(OUT, "logo-parche-192.png"))
