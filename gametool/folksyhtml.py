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
#

import os
from string import Template

langs = {
    "en": {
        "run": u"Run!",
        "clickanimal": u"Click on the animal for the next question."
        },
    "sv": {
        "run": u"Sätt igång!",
        "clickanimal": u"Klicka på djuret för att gå vidare till nästa fråga."
        }
    }
        
prereqs_js = [
    "${href_prefix}js/vendor/firebug-fallback.js",
    "${href_prefix}js/vendor/sprintf-0.7-beta1.js",
    "https://code.createjs.com/soundjs-0.6.0.min.js",
    # "${href_prefix}js/soundjs.flashplugin-0.4.0.min.js",
    "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js",
    "${href_prefix}js/vendor/es5-shim.js",
    "${href_prefix}js/vendor/jquery.transform2d.js"]

folksy_js = [
    "${href_prefix}js/util.js",
    "${href_prefix}js/gamelogic.js",
    "${href_prefix}js/layout.js",
    "${href_prefix}js/folksy.js"]
    
def scripts(list):
    tmpl = u'        <script type="text/javascript" src="%s"></script>\n'
    return "".join([tmpl % x for x in list])

    
substs = {
    "prereqs": scripts(prereqs_js),
    "folksy": scripts(folksy_js) + u"""
        <script type="text/javascript">
                jQuery(function () {
                    folksy.setDebugMode(true);
                    var gameDiv = jQuery("#game")[0];
                    window.folksyGame = new folksy.Game(gameDiv);
                    window.folksyGame.initWithURL('${json_loc}');
                });
        </script>
        """,
    "runbutton": u"""
	<div id="load_progress" class="info"></div>
	<button class="bigbutton" id="start_game">${run}</button>
        """,
    "game": u"""
        <div id="game">
        </div>
        <div id="tip">
                $clickanimal
        </div>
        <div id="info">
        </div>
        """
}

class FolksyHtml:
    def __init__(self, lang, gamevars):
        """gamevars we want included: `name`, `json_loc`"""
        self.lang = lang
        self.gamevars = gamevars

    def get_substs(self):
        # Substitute the substitutes.
        lang_substs = langs[self.lang]
        all_substs = dict(lang_substs.items() + self.gamevars.items())
        all_substs['href_prefix'] = os.environ.get("FOLKSY_HREF_PREFIX", "")

        new_substs = all_substs
        for key, val in substs.iteritems():
            new_substs[key] = Template(val).substitute(all_substs)
        return new_substs

    def substitute(self, s):
        return Template(s).substitute(self.get_substs())
