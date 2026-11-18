"""Material de Play Store: icono 512x512, feature graphic 1024x500 por idioma y utilidades comunes.

Uso (desde la raíz del repo, requiere Pillow):
    python3 generate_store_assets.py                    # store-icon.png + feature graphic de los 9 idiomas
    python3 generate_store_assets.py --locale en-US     # solo ese idioma (repetible)
    python3 generate_store_assets.py --no-icon          # sin regenerar assets/store-icon.png

Las capturas de pantalla las genera generate_store_screenshots.py, que reutiliza este módulo.
Salida en dist-store-assets/<locale>/ (ignorado por git). Titulares en store_captions.json.
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
FONT_PATH = ROOT / 'assets' / 'fonts' / 'Inter-Bold.ttf'
CAPTIONS_PATH = ROOT / 'store_captions.json'
APP_ICON_PATH = ROOT / 'assets' / 'icon.png'
STORE_ICON_PATH = ROOT / 'assets' / 'store-icon.png'
APP_JSON_PATH = ROOT / 'app.json'
OUT_DIR = ROOT / 'dist-store-assets'

# Azul de la marca (theme.accent #4A90E2) hacia un azul más profundo para dar contraste al texto blanco
BRAND_TOP = (74, 144, 226)
BRAND_BOTTOM = (28, 72, 140)
TEXT_COLOR = (255, 255, 255)

SCREENSHOT_KEYS = [
    '01_notification', '02_alerts', '03_home', '04_forecast', '05_official', '06_radar', '07_dark',
]
SCREENSHOT_SIZE = (1080, 1920)
MIN_SCREENSHOTS = 2  # mínimo de Play por ficha; las capturas que falten se omiten
FEATURE_SIZE = (1024, 500)
FEATURE_NAME = 'feature-graphic.png'
MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024
MAX_FEATURE_BYTES = 15 * 1024 * 1024

# Feature graphic
FG_FONT_SIZE = 60
FG_ICON_SIZE = 300
FG_MARGIN = 64
FG_GAP = 56


class StoreAssetError(Exception):
    """Error que debe parar el script con un mensaje claro (titular que no cabe, captura que falta...)."""


# ---------------------------------------------------------------- comunes

def load_captions() -> dict:
    with open(CAPTIONS_PATH, encoding='utf-8') as f:
        return json.load(f)['locales']


def select_locales(captions: dict, requested: list | None) -> list:
    if not requested:
        return list(captions)
    unknown = [loc for loc in requested if loc not in captions]
    if unknown:
        raise StoreAssetError(f'Idioma desconocido: {", ".join(unknown)}. Disponibles: {", ".join(captions)}')
    return requested


def load_font(size: int) -> ImageFont.FreeTypeFont:
    if not FONT_PATH.exists():
        raise StoreAssetError(f'No encuentro la fuente {FONT_PATH.relative_to(ROOT)}')
    return ImageFont.truetype(str(FONT_PATH), size)


def vertical_gradient(size: tuple, top=BRAND_TOP, bottom=BRAND_BOTTOM) -> Image.Image:
    mask = Image.linear_gradient('L').resize(size, Image.BICUBIC)
    return Image.composite(Image.new('RGB', size, bottom), Image.new('RGB', size, top), mask)


def split_into_lines(text: str, font: ImageFont.FreeTypeFont, max_width: int, context: str) -> list:
    """Reparte el titular en 1 o 2 líneas que quepan en max_width, lo más equilibradas posible.

    Nunca reduce la fuente ni recorta: si no cabe en 2 líneas lanza StoreAssetError.
    """
    words = text.split()
    if font.getlength(text) <= max_width:
        return [text]
    best = None
    for i in range(1, len(words)):
        first, second = ' '.join(words[:i]), ' '.join(words[i:])
        widest = max(font.getlength(first), font.getlength(second))
        if widest <= max_width and (best is None or widest < best[0]):
            best = (widest, [first, second])
    if best is None:
        widths = ', '.join(f'"{w}" {font.getlength(w):.0f}px' for w in words)
        raise StoreAssetError(
            f'{context}: el titular "{text}" no cabe en 2 líneas de {max_width}px '
            f'con Inter Bold {font.size}px (palabras: {widths}). Acórtalo en {CAPTIONS_PATH.name}.'
        )
    return best[1]


def rounded_mask(size: tuple, radius: int) -> Image.Image:
    """Máscara con esquinas redondeadas y antialias (se dibuja a 4x y se reduce)."""
    scale = 4
    big = Image.new('L', (size[0] * scale, size[1] * scale), 0)
    ImageDraw.Draw(big).rounded_rectangle([0, 0, big.width - 1, big.height - 1], radius=radius * scale, fill=255)
    return big.resize(size, Image.LANCZOS)


def paste_with_shadow(canvas: Image.Image, img: Image.Image, pos: tuple, radius: int,
                      blur: int = 28, offset: int = 16, opacity: int = 90) -> None:
    """Pega img en canvas con esquinas redondeadas y una sombra suave debajo."""
    mask = rounded_mask(img.size, radius)
    pad = blur * 3
    shadow = Image.new('RGBA', (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    shadow_alpha = Image.new('L', shadow.size, 0)
    shadow_alpha.paste(mask.point(lambda a: a * opacity // 255), (pad, pad))
    shadow.putalpha(shadow_alpha.filter(ImageFilter.GaussianBlur(blur)))
    canvas.paste(shadow, (pos[0] - pad, pos[1] - pad + offset), shadow)
    canvas.paste(img.convert('RGB'), pos, mask)


def adaptive_icon_background() -> tuple:
    with open(APP_JSON_PATH, encoding='utf-8') as f:
        hex_color = json.load(f)['expo']['android']['adaptiveIcon']['backgroundColor'].lstrip('#')
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def app_icon_opaque() -> Image.Image:
    """assets/icon.png aplanado sobre el color de fondo del adaptive icon (sin transparencia)."""
    icon = Image.open(APP_ICON_PATH).convert('RGBA')
    base = Image.new('RGBA', icon.size, adaptive_icon_background() + (255,))
    return Image.alpha_composite(base, icon)


# ---------------------------------------------------------------- icono 512

def make_store_icon() -> Path:
    """512x512, PNG de 32 bits, opaco y SIN esquinas redondeadas propias (Play aplica la máscara)."""
    icon = app_icon_opaque().resize((512, 512), Image.LANCZOS)
    icon.putalpha(255)
    icon.save(STORE_ICON_PATH, optimize=True)
    return STORE_ICON_PATH


# ---------------------------------------------------------------- feature graphic

def check_feature_caption(locale: str, text: str) -> list:
    font = load_font(FG_FONT_SIZE)
    text_width = FEATURE_SIZE[0] - FG_MARGIN * 2 - FG_ICON_SIZE - FG_GAP
    return split_into_lines(text, font, text_width, f'{locale} / feature graphic')


def make_feature_graphic(locale: str, text: str) -> Path:
    w, h = FEATURE_SIZE
    canvas = vertical_gradient(FEATURE_SIZE)

    icon = app_icon_opaque().resize((FG_ICON_SIZE, FG_ICON_SIZE), Image.LANCZOS)
    paste_with_shadow(canvas, icon, (FG_MARGIN, (h - FG_ICON_SIZE) // 2), radius=int(FG_ICON_SIZE * 0.22),
                      blur=18, offset=10, opacity=80)

    font = load_font(FG_FONT_SIZE)
    lines = check_feature_caption(locale, text)
    line_height = int(FG_FONT_SIZE * 1.18)
    ascent, descent = font.getmetrics()
    block_h = line_height * (len(lines) - 1) + ascent + descent
    x = FG_MARGIN + FG_ICON_SIZE + FG_GAP
    y = (h - block_h) // 2
    draw = ImageDraw.Draw(canvas)
    for i, line in enumerate(lines):
        draw.text((x, y + i * line_height), line, font=font, fill=TEXT_COLOR)

    out = OUT_DIR / locale / FEATURE_NAME
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)
    return out


# ---------------------------------------------------------------- comprobación final

def verify(locales: list, expect_screenshots: bool = True) -> bool:
    """Comprueba tamaños, formato y peso de lo generado e imprime un resumen. Devuelve True si todo es válido."""
    problems = []
    total_images = 0
    print('\nComprobación de dist-store-assets/  (capturas: válidas/generadas)')
    print(f'{"idioma":<8} {"capturas":>9} {"feature":>8} {"mayor captura":>14}')
    for locale in locales:
        folder = OUT_DIR / locale
        shots_ok = 0
        shots_found = 0
        biggest = 0
        if expect_screenshots:
            # Las capturas son opcionales: se comprueban las que existan (como mínimo MIN_SCREENSHOTS)
            for key in SCREENSHOT_KEYS:
                path = folder / f'{key}.png'
                if not path.exists():
                    continue
                shots_found += 1
                size = path.stat().st_size
                biggest = max(biggest, size)
                with Image.open(path) as im:
                    if im.size != SCREENSHOT_SIZE:
                        problems.append(f'{locale}/{path.name}: {im.size}, se esperaba {SCREENSHOT_SIZE}')
                    elif im.format not in ('PNG', 'JPEG') or im.mode not in ('RGB', 'L'):
                        problems.append(f'{locale}/{path.name}: formato {im.format}/{im.mode} (Play pide PNG/JPEG sin alfa)')
                    elif size >= MAX_SCREENSHOT_BYTES:
                        problems.append(f'{locale}/{path.name}: {size / 1e6:.1f} MB (máx. 8 MB)')
                    else:
                        shots_ok += 1
        fg = folder / FEATURE_NAME
        fg_ok = False
        if not fg.exists():
            problems.append(f'{locale}: falta {FEATURE_NAME}')
        else:
            with Image.open(fg) as im:
                if im.size != FEATURE_SIZE:
                    problems.append(f'{locale}/{FEATURE_NAME}: {im.size}, se esperaba {FEATURE_SIZE}')
                elif im.format not in ('PNG', 'JPEG') or im.mode not in ('RGB', 'L'):
                    problems.append(f'{locale}/{FEATURE_NAME}: formato {im.format}/{im.mode}')
                elif fg.stat().st_size >= MAX_FEATURE_BYTES:
                    problems.append(f'{locale}/{FEATURE_NAME}: {fg.stat().st_size / 1e6:.1f} MB (máx. 15 MB)')
                else:
                    fg_ok = True
        if expect_screenshots and shots_found < MIN_SCREENSHOTS:
            problems.append(f'{locale}: {shots_found} captura(s), Play pide al menos {MIN_SCREENSHOTS}')
        total_images += (shots_ok if expect_screenshots else 0) + (1 if fg_ok else 0)
        shots_col = f'{shots_ok}/{shots_found}' if expect_screenshots else '-'
        big_col = f'{biggest / 1e6:.2f} MB' if expect_screenshots else '-'
        print(f'{locale:<8} {shots_col:>9} {"ok" if fg_ok else "ERROR":>8} {big_col:>14}')

    if STORE_ICON_PATH.exists():
        with Image.open(STORE_ICON_PATH) as im:
            opaque = im.mode == 'RGBA' and im.getchannel('A').getextrema() == (255, 255)
            if im.size != (512, 512) or not opaque:
                problems.append(f'store-icon.png: {im.size} {im.mode}, se esperaba 512x512 RGBA opaco')
            else:
                print('store-icon.png  512x512, 32 bits, opaco: ok')

    if problems:
        print('\nPROBLEMAS:')
        for p in problems:
            print(f'  - {p}')
        return False
    print(f'\nTodo correcto: {total_images} imágenes en {len(locales)} idioma(s).')
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description='Icono 512 y feature graphic de Play Store.')
    parser.add_argument('--locale', action='append', help='Solo este idioma (repetible). Por defecto, todos.')
    parser.add_argument('--no-icon', action='store_true', help='No regenerar assets/store-icon.png')
    args = parser.parse_args()
    try:
        captions = load_captions()
        locales = select_locales(captions, args.locale)
        for locale in locales:  # validar todos los titulares antes de escribir nada
            check_feature_caption(locale, captions[locale]['feature'])
        if not args.no_icon:
            print(f'✅ {make_store_icon().relative_to(ROOT)}')
        for locale in locales:
            print(f'✅ {make_feature_graphic(locale, captions[locale]["feature"]).relative_to(ROOT)}')
    except StoreAssetError as e:
        print(f'❌ {e}', file=sys.stderr)
        return 1
    return 0 if verify(locales, expect_screenshots=False) else 1


if __name__ == '__main__':
    sys.exit(main())
