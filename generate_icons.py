from PIL import Image, ImageDraw
import os

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo azul redondeado
    margin = size * 0.05
    radius = size * 0.22
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(74, 144, 226, 255)  # #4A90E2
    )

    cx = size / 2
    cy = size / 2

    # Nube (círculos blancos)
    cloud_y = cy + size * 0.08
    cloud_r = size * 0.16
    draw.ellipse([cx - cloud_r * 1.1, cloud_y - cloud_r * 0.7,
                  cx + cloud_r * 0.1, cloud_y + cloud_r * 0.7], fill='white')
    draw.ellipse([cx - cloud_r * 0.3, cloud_y - cloud_r,
                  cx + cloud_r * 0.9, cloud_y + cloud_r * 0.3], fill='white')
    draw.ellipse([cx + cloud_r * 0.2, cloud_y - cloud_r * 0.5,
                  cx + cloud_r * 1.4, cloud_y + cloud_r * 0.6], fill='white')
    draw.rectangle([cx - cloud_r * 1.1, cloud_y,
                    cx + cloud_r * 1.4, cloud_y + cloud_r * 0.7], fill='white')

    # Sol (círculo amarillo)
    sun_cx = cx - size * 0.08
    sun_cy = cy - size * 0.1
    sun_r = size * 0.15
    draw.ellipse([sun_cx - sun_r, sun_cy - sun_r,
                  sun_cx + sun_r, sun_cy + sun_r],
                 fill=(245, 166, 35, 255))  # #F5A623

    # Rayos del sol
    ray_len = size * 0.08
    ray_w = max(2, int(size * 0.025))
    offsets = [(0, -1), (0.7, -0.7), (1, 0), (0.7, 0.7), (-0.7, -0.7)]
    for ox, oy in offsets:
        draw.line([
            sun_cx + ox * sun_r * 1.15,
            sun_cy + oy * sun_r * 1.15,
            sun_cx + ox * (sun_r + ray_len),
            sun_cy + oy * (sun_r + ray_len),
        ], fill=(245, 166, 35, 255), width=ray_w)

    return img

# Icono principal 1024x1024
icon = draw_icon(1024)
icon.save('assets/icon.png')
print('✅ icon.png generado')

# Icono Android foreground (sin fondo, más grande)
fg = draw_icon(1024)
fg.save('assets/android-icon-foreground.png')
print('✅ android-icon-foreground.png generado')

# Splash screen 1284x2778 (iPhone Pro Max)
splash_w, splash_h = 1284, 2778
splash = Image.new('RGBA', (splash_w, splash_h), (74, 144, 226, 255))
icon_small = draw_icon(320)
x = (splash_w - 320) // 2
y = (splash_h - 320) // 2
splash.paste(icon_small, (x, y), icon_small)
splash.save('assets/splash-icon.png')
print('✅ splash-icon.png generado')

print('\n🎉 Todos los iconos generados en /assets/')
