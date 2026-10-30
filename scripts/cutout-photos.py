#!/usr/bin/env python3
"""Cut the product photos out of their white backgrounds (they're all shot on pure white).

  python3 -I scripts/cutout-photos.py public/img/parts public/img/parts-cut [file ...]

Writes transparent WebP files with the same names (.webp). Only the white that touches the
picture's edge is removed, so white parts of the engine itself stay. Edges are anti-aliased and
the white fringe is removed from semi-transparent pixels.
"""
import os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
only = sys.argv[3:]
os.makedirs(OUT, exist_ok=True)

def cut(path, out):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    # "how far from white" per pixel = 255 - darkest channel
    r, g, b = im.split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    notwhite = darkest.point(lambda v: 255 - v)                     # 0 = pure white
    # background = near-white region connected to the border
    near = notwhite.point(lambda v: 255 if v < 34 else 0)            # 255 = near white (incl. JPEG halo)
    flood = near.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)] + [(x, 0) for x in range(0, w, 13)] + [(x, h - 1) for x in range(0, w, 13)] + [(0, y) for y in range(0, h, 13)] + [(w - 1, y) for y in range(0, h, 13)]:
        if flood.getpixel(seed) == 255:
            ImageDraw.floodfill(flood, seed, 128)
    bg = flood.point(lambda v: 255 if v == 128 else 0)                # 255 = background
    # soft alpha: inside the part = opaque; at the boundary use the distance from white
    hard = ImageChops.invert(bg).filter(ImageFilter.MaxFilter(3))      # part + 1px ring
    soft = notwhite.point(lambda v: min(255, v * 6))
    alpha = ImageChops.darker(hard.filter(ImageFilter.GaussianBlur(0.6)), ImageChops.lighter(soft, ImageChops.invert(bg.filter(ImageFilter.MaxFilter(5)))))
    # pull the edge in ~1px so the light fringe around the part disappears on dark backgrounds
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.6))
    # remove white fringe: un-mix white from partially transparent pixels
    px, ap = im.load(), alpha.load()
    outim = Image.new("RGBA", (w, h))
    op = outim.load()
    for y in range(h):
        for x in range(w):
            a = ap[x, y]
            if a == 0:
                op[x, y] = (0, 0, 0, 0)
                continue
            c = px[x, y]
            if a < 255:
                f = a / 255
                c = tuple(max(0, min(255, int((v - (1 - f) * 255) / f))) for v in c)
            op[x, y] = (*c, a)
    bbox = outim.getbbox()
    if bbox:
        outim = outim.crop(bbox)
    outim.save(out, "WEBP", quality=86, method=6)

files = only or sorted(f for f in os.listdir(SRC) if f.lower().endswith((".jpg", ".jpeg", ".png")))
for i, f in enumerate(files):
    cut(os.path.join(SRC, f), os.path.join(OUT, os.path.splitext(f)[0] + ".webp"))
    if (i + 1) % 50 == 0:
        print(f"{i + 1}/{len(files)}", flush=True)
print(f"done: {len(files)} photos")
