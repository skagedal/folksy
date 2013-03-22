#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import glob, json
sys.path = ['../..'] + sys.path
from buildsupport import *


sources = glob.glob('sound/*/*.ogg')

IMAGES = [
    'cat.png', 
    'monkey.png', 
    'panda.png',
    'penguin.png',
    'pig.png',
    'sheep.png',
    'walrus.png'
]
LANGS = ['en', 'sv']
SOUNDS = [
    'awesome.ogg', 
    'congratulation.ogg', 
    'fantastic.ogg',
    'good.ogg', 
    'great.ogg', 
    'perfect.ogg', 
    'super.ogg',
    'waytogo.ogg'
]
GCOMPRIS_VERSION = '12.01'


def build():
    for source in sources:
        run('ffmpeg', '-y', '-i', source, path.splitext(source)[0] + '.mp3')
    module()
    credits()

def clean():
    autoclean()

def fromgcompris():
    project = 'gcompris-' + GCOMPRIS_VERSION
    tgz_file = project + '.tar.gz' 
    url = 'http://sourceforge.net/projects/gcompris/files/%s/%s/download' % \
          (GCOMPRIS_VERSION, tgz_file)
    unpack = '%s/boards/voices/' % project
    if not path.isdir(project):
        if not path.isfile(tgz_file):
            download(url, tgz_file)
        vcall(['tar', 'xf', tgz_file, unpack])
    
    for lang in LANGS:
        mkpath(lang)
        for file in SOUNDS:
            vcall(['cp', '%s/boards/voices/%s/misc/%s' % \
                       (project, lang, file),
                   lang])
                                                       
def _make_json(lang):
    json_rewards = {}
    def sound(file):
        file_base = 'modules/cute-rewards/sounds/%s/%s' % \
            (lang, path.splitext(file)[0])
        return { 'sound_srcs': [file_base + '.ogg',
                                file_base + '.mp3'] }
    def image(file):
        return { 'image_src': 'modules/cute-rewards/images/' + file }
    json_rewards['sounds'] = [sound(file) for file in SOUNDS]
    json_rewards['images'] = [image(file) for file in IMAGES]
    return { 'rewards': json_rewards }

def module():
    for lang in LANGS:
        json.dump(_make_json(lang), open(lang + '.json', 'w'), indent = 4)

def credits():
    run("bash", "-c", "python credits.py > en_credits.html")

main()
