#!/usr/bin/python
# -*- coding: utf-8 -*-
#
#   This file is part of Folksy, a framework for educational games.
#
#   Folksy is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   Folksy is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with Folksy.  If not, see <http://www.gnu.org/licenses/>.

import sys
sys.path = ['../..'] + sys.path
from buildsupport import *

sources = ["../../js/%s.js" % s for s in
           "util", "gamelogic", "layout", "folksy"]

def build():
    # fabricate doesn't work as it should here (because it ignores 
    # deps from other directories?) so just use a normal call for now
    subprocess.call(['jsdoc', '-d=.', '-p'] + sources)

def clean():
    autoclean()

main()
