#!/usr/bin/python
# -*- coding: utf-8 -*-

import cairo
import unicodedata

def letter_image(letter, width, height, select = False):
    filename_base = unicodedata.name(letter).replace(" ", "_")
    if select:
        filename_base += "_select"
    
    surface = cairo.SVGSurface(filename_base + ".svg", width, height)
    ctx = cairo.Context(surface)

    ctx.scale(width, height)
    
    ctx.rectangle(0, 0, 1, 1)
    if select:
        ctx.set_source_rgb(0.8, 1.0, 0.7)
    else:
        ctx.set_source_rgb(1, 1, 1)
    ctx.fill()

    line_width = 0.05
    ctx.set_line_width(line_width)
    ctx.set_source_rgb(0.2, 0.7, 0.4)
    ctx.rectangle(line_width / 2, line_width / 2, 
                  1 - line_width, 1 - line_width)
    ctx.stroke()

    ctx.select_font_face("FreeSans", 
                         cairo.FONT_SLANT_NORMAL, 
                         cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(0.8)

    fascent, fdescent, fheight, fxadvance, fyadvance = ctx.font_extents()
    xbearing, ybearing, width, height, xadvance, yadvance = \
        ctx.text_extents(letter)

    x = 0.5 - xbearing - width / 2
    y = 0.5 - fdescent + fheight / 2

    ctx.move_to(x, y)
    ctx.set_source_rgb(0, 0, 0)
    ctx.show_text(letter)

    surface.write_to_png(filename_base + ".png")
    ctx.show_page()
    surface.finish()

for letter in u"ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ":
    letter_image(letter, 200, 200, False)
    letter_image(letter, 200, 200, True)
