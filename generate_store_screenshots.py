"""Capturas de Play Store (teléfono, 1080x1920) con titular por idioma, más el feature graphic.

Uso (desde la raíz del repo, requiere Pillow):
    python3 generate_store_screenshots.py --raw ~/capturas-avisa
    python3 generate_store_screenshots.py --raw ~/capturas-avisa --locale de-DE   # solo un idioma

--raw debe contener dos subcarpetas, es/ y en/, con 01_notification, 02_alerts, 03_home,
04_forecast, 05_official, 06_radar y 07_dark (.png; también se aceptan .jpg). es-ES y es-419 usan
es/; el resto de idiomas, en/. Se aceptan capturas de cualquier resolución vertical (720x1280,
1080x2400...): se recorta la barra de estado y se escalan para encajar.

Salida en dist-store-assets/<locale>/ (ignorado por git). Si algún titular no cabe en 2 líneas el
script falla antes de generar nada, sin recortar ni reducir la fuente.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from generate_store_assets import (
    OUT_DIR, ROOT, SCREENSHOT_KEYS, SCREENSHOT_SIZE, TEXT_COLOR, StoreAssetError,
    load_captions, load_font, make_feature_graphic, check_feature_caption, paste_with_shadow,
    select_locales, split_into_lines, verify, vertical_gradient,
)

HEADLINE_SIZE = 80
HEADLINE_LINE_HEIGHT = int(HEADLINE_SIZE * 1.15)
SIDE_MARGIN = 80
HEADER_HEIGHT = 440          # banda superior para el titular; la captura empieza siempre aquí
BOTTOM_MARGIN = 90
SHOT_MAX_WIDTH = 900
SHOT_RADIUS = 44
EXTENSIONS = ('.png', '.jpg', '.jpeg')

# Barra de estado de Android: ~24 dp, más con cámara perforada. Se recorta algo de más (32 dp):
# lo que se pierde es margen superior de la app, nunca contenido. Densidad estimada con 360 dp de ancho.
DEFAULT_STATUS_BAR_DP = 32


def find_raw(raw_dir: Path, source: str, key: str) -> Path | None:
    for ext in EXTENSIONS:
        path = raw_dir / source / f'{key}{ext}'
        if path.exists():
            return path
    return None


def crop_status_bar(img: Image.Image, crop_top: int | None, status_bar_dp: float, crop_bottom: int) -> tuple:
    if img.width > img.height:
        raise StoreAssetError(f'la captura está en horizontal ({img.width}x{img.height})')
    top = crop_top if crop_top is not None else round(status_bar_dp * img.width / 360)
    if top + crop_bottom >= img.height // 2:
        raise StoreAssetError(f'recorte excesivo ({top}px arriba, {crop_bottom}px abajo) para {img.width}x{img.height}')
    return img.crop((0, top, img.width, img.height - crop_bottom)), top


def compose(shot: Image.Image, lines: list) -> Image.Image:
    w, h = SCREENSHOT_SIZE
    canvas = vertical_gradient(SCREENSHOT_SIZE)
    draw = ImageDraw.Draw(canvas)
    font = load_font(HEADLINE_SIZE)

    # Titular centrado en la banda superior (misma posición de captura en todas las imágenes)
    ascent, descent = font.getmetrics()
    block_h = HEADLINE_LINE_HEIGHT * (len(lines) - 1) + ascent + descent
    y = (HEADER_HEIGHT - block_h) // 2 + 10
    for i, line in enumerate(lines):
        draw.text((w / 2, y + i * HEADLINE_LINE_HEIGHT), line, font=font, fill=TEXT_COLOR, anchor='ma')

    avail_w, avail_h = SHOT_MAX_WIDTH, h - HEADER_HEIGHT - BOTTOM_MARGIN
    scale = min(avail_w / shot.width, avail_h / shot.height)
    size = (round(shot.width * scale), round(shot.height * scale))
    resized = shot.convert('RGB').resize(size, Image.LANCZOS)
    paste_with_shadow(canvas, resized, ((w - size[0]) // 2, HEADER_HEIGHT), radius=SHOT_RADIUS)
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description='Capturas de Play Store con titular por idioma.')
    parser.add_argument('--raw', required=True, type=Path, help='Carpeta con las subcarpetas es/ y en/')
    parser.add_argument('--locale', action='append', help='Solo este idioma (repetible). Por defecto, los 9.')
    parser.add_argument('--status-bar-dp', type=float, default=DEFAULT_STATUS_BAR_DP,
                        help=f'Alto a recortar arriba, en dp (por defecto {DEFAULT_STATUS_BAR_DP})')
    parser.add_argument('--crop-top', type=int, help='Recorte superior exacto en píxeles (sustituye a --status-bar-dp)')
    parser.add_argument('--crop-bottom', type=int, default=0, help='Recorte inferior en píxeles (barra de navegación)')
    parser.add_argument('--skip-feature', action='store_true', help='No generar el feature graphic')
    args = parser.parse_args()

    try:
        captions = load_captions()
        locales = select_locales(captions, args.locale)
        raw_dir = args.raw.expanduser().resolve()

        # 1) Validar todo antes de escribir nada: capturas presentes y titulares que caben
        font = load_font(HEADLINE_SIZE)
        max_width = SCREENSHOT_SIZE[0] - SIDE_MARGIN * 2
        errors, plan = [], {}
        for locale in locales:
            entry = captions[locale]
            texts = entry['screenshots']
            missing_keys = [k for k in SCREENSHOT_KEYS if k not in texts]
            if missing_keys:
                errors.append(f'{locale}: faltan titulares en store_captions.json: {", ".join(missing_keys)}')
                continue
            for key in SCREENSHOT_KEYS:
                raw = find_raw(raw_dir, entry['source'], key)
                if raw is None:
                    errors.append(f'falta {raw_dir / entry["source"] / key}.png (para {locale})')
                try:
                    plan[(locale, key)] = (raw, split_into_lines(texts[key], font, max_width, f'{locale} / {key}'))
                except StoreAssetError as e:
                    errors.append(str(e))
            if not args.skip_feature:
                try:
                    check_feature_caption(locale, entry['feature'])
                except StoreAssetError as e:
                    errors.append(str(e))
        if errors:
            # Una captura que falta se repite en todos los idiomas que la usan: sin duplicados
            raise StoreAssetError('no se ha generado nada:\n  - ' + '\n  - '.join(dict.fromkeys(errors)))

        # 2) Generar
        cache = {}
        for locale in locales:
            out_dir = OUT_DIR / locale
            out_dir.mkdir(parents=True, exist_ok=True)
            for key in SCREENSHOT_KEYS:
                raw, lines = plan[(locale, key)]
                if raw not in cache:
                    with Image.open(raw) as im:
                        cropped, top = crop_status_bar(im.copy(), args.crop_top, args.status_bar_dp, args.crop_bottom)
                    cache[raw] = cropped
                    print(f'   {raw.relative_to(raw_dir)}: {im.width}x{im.height}, recortados {top}px arriba')
                compose(cache[raw], lines).save(out_dir / f'{key}.png', optimize=True)
            print(f'✅ {out_dir.relative_to(ROOT)}/ — 7 capturas')
            if not args.skip_feature:
                make_feature_graphic(locale, captions[locale]['feature'])
                print(f'✅ {out_dir.relative_to(ROOT)}/feature-graphic.png')
    except StoreAssetError as e:
        print(f'❌ {e}', file=sys.stderr)
        return 1

    if args.skip_feature:
        return 0
    return 0 if verify(locales) else 1


if __name__ == '__main__':
    sys.exit(main())
