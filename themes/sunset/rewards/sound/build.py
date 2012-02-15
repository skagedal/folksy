#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import glob
sys.path = ['../../../..'] + sys.path
from buildsupport import *

sources = glob.glob('*.ogg')

def build():
    for source in sources:
        run('ffmpeg', '-y', '-i', source, path.splitext(source)[0] + '.mp3')

def clean():
    autoclean()

main()
