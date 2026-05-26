from PIL import Image
import os

# Archivos de origen (capturas que has subido)
screenshots = [
    '/home/david/Descargas/Captura 2026-05-19 a las 16.24.58(1).png',
    '/home/david/Descargas/Captura 2026-05-20 a las 16.40.57(2).png',
    '/home/david/Descargas/Captura 2026-05-19 a las 16.28.34(1).png',
    '/home/david/Descargas/Captura 2026-05-19 a las 16.18.15(1).png',
]

os.makedirs('assets/store_screenshots/phone', exist_ok=True)
os.makedirs('assets/store_screenshots/tablet_7', exist_ok=True)
os.makedirs('assets/store_screenshots/tablet_10', exist_ok=True)

# Teléfono: 1080x1920 (9:16)
PHONE_SIZE = (1080, 1920)
# Tablet 7": 1080x1920
TABLET_7_SIZE = (1080, 1920)
# Tablet 10": 1200x1920
TABLET_10_SIZE = (1200, 1920)

def resize_fit(img, target_w, target_h):
    # Redimensiona manteniendo proporción y añade padding negro si hace falta
    img_ratio = img.width / img.height
    target_ratio = target_w / target_h

    if img_ratio > target_ratio:
        new_w = target_w
        new_h = int(target_w / img_ratio)
    else:
        new_h = target_h
        new_w = int(target_h * img_ratio)

    img_resized = img.resize((new_w, new_h), Image.LANCZOS)
    result = Image.new('RGB', (target_w, target_h), (240, 244, 255))
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    result.paste(img_resized, (x, y))
    return result

names = ['home', 'forecast', 'alerts', 'settings']

for i, path in enumerate(screenshots):
    img = Image.open(path)
    name = names[i]

    # Teléfono
    phone = resize_fit(img, *PHONE_SIZE)
    phone.save(f'assets/store_screenshots/phone/{name}.png')
    print(f'✅ phone/{name}.png')

    # Tablet 7"
    t7 = resize_fit(img, *TABLET_7_SIZE)
    t7.save(f'assets/store_screenshots/tablet_7/{name}.png')
    print(f'✅ tablet_7/{name}.png')

    # Tablet 10"
    t10 = resize_fit(img, *TABLET_10_SIZE)
    t10.save(f'assets/store_screenshots/tablet_10/{name}.png')
    print(f'✅ tablet_10/{name}.png')

print('\n🎉 Screenshots generadas en assets/store_screenshots/')