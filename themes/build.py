#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
sys.path = ['..'] + sys.path
from buildsupport import *

subdirs = subdirectories()
    
for subdir in subdirs:
    recurse(subdir)


