from PIL import Image, ImageDraw

def draw_weather_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo azul redondeado
    margin = size * 0.05
    radius = size * 0.22
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(74, 144, 226, 255)
    )

    cx = size / 2
    cy = size / 2

    # Nube
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

    # Sol
    sun_cx = cx - size * 0.08
    sun_cy = cy - size * 0.1
    sun_r = size * 0.15
    draw.ellipse([sun_cx - sun_r, sun_cy - sun_r,
                  sun_cx + sun_r, sun_cy + sun_r],
                 fill=(245, 166, 35, 255))

    # Rayos
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

# Icono 512x512 para Google Play
icon = draw_weather_icon(512)
icon.save('assets/store-icon.png')
print('✅ store-icon.png generado (512x512)')

# Feature graphic 1024x500
fg_w, fg_h = 1024, 500
fg = Image.new('RGB', (fg_w, fg_h), (74, 144, 226))
draw = ImageDraw.Draw(fg)

# Degradado simulado con rectángulos
for i in range(fg_h):
    ratio = i / fg_h
    r = int(74 + (13 - 74) * ratio)
    g = int(144 + (17 - 144) * ratio)
    b = int(226 + (167 - 226) * ratio)
    draw.line([(0, i), (fg_w, i)], fill=(r, g, b))

# Icono centrado a la izquierda
icon_fg = draw_weather_icon(220)
fg.paste(icon_fg, (80, (fg_h - 220) // 2), icon_fg)

# Texto "WeatherAlert" simulado con rectángulos blancos
text_x = 340
text_y = 160
# Barra título
draw.rectangle([text_x, text_y, text_x + 280, text_y + 28], fill=(255, 255, 255, 200))
# Barra subtítulo
draw.rectangle([text_x, text_y + 50, text_x + 380, text_y + 18 + 50], fill=(255, 255, 255, 120))
# Barra subtítulo 2
draw.rectangle([text_x, text_y + 85, text_x + 320, text_y + 18 + 85], fill=(255, 255, 255, 120))

fg.save('assets/feature-graphic.png')
print('✅ feature-graphic.png generado (1024x500)')

print('\n🎉 Assets de la store generados en /assets/')