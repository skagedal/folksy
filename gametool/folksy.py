#!/usr/bin/python
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

# Want this to keep working with both Python 2.6 and Python 2.7.

import sys
import os
import os.path
import json
import locale
import distutils.dir_util
from optparse import OptionParser

# non-standard libraries
import yaml
import PIL.Image
#import pycountry

FolksyOptions = {
    "image_extensions": [".jpg", ".jpeg", ".JPG", ".png", ".PNG", ".gif"]
}

class GameTypeError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

class GameLoadError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

class Game:
    def __init__(self, _folksy, _game_id, _path):
        self.folksy = _folksy
        self.game_id = _game_id # TODO: should check if valid id i.e. [A-Za-z_]
        self.path = _path
        self.yaml = None        # not loaded

    def load(self):
        try:
            self.yaml = yaml.load(open(os.path.join(self.path, "game.yaml")).read())
        except IOError as e:
            raise GameLoadError("couldn't open game.yaml file: " + str(e))
        except yaml.YAMLError as e:
            raise GameLoadError("couldn't parse YAML: " + str(e))

        self.name = self.yaml.get("name", "<untitled>")

        try:
            self.gametype = self.folksy.get_gametype(self.yaml["gametype"])
        except KeyError:
            raise GameLoadError("game has no gametype")
        except GameTypeError as e:
            raise GameLoadError(e.value)

        self.theme = self.yaml.get("theme", self.gametype.get_default_theme())
        if not self.gametype.is_valid_theme(self.theme):
            raise GameLoadError("not a valid %s theme: %s" % (self.gametype, self.theme))

        self.lang = self.yaml.get("lang", locale.getdefaultlocale()[0].split('_')[0].lower())
        # We could check if lang is valid with pycountry. Do we want to?

    def show_info(self):
        print ("id:           " + self.game_id)
        print ("path:         " + self.path)
        print ("name:         " + self.name)
        print ("gametype:     " + str(self.gametype))
        print ("theme:        " + self.theme)
        print ("lang:         " + self.lang)

    def build(self):
        # This is the stuff that will get dumped to the json file.
        self.json = {}

        self.buildpath = os.path.join(self.folksy.buildpath, self.game_id)
        print("building in:   " + self.buildpath)
        try:
            distutils.dir_util.mkpath(self.buildpath)
        except distutils.DistutilsFileError as e:
            raise GameBuildError("couldn't create build path " + self.buildpath)

        self.json['id'] = self.game_id
        self.json['name'] = self.name
        self.json['gametype'] = str(self.gametype)
        self.json['lang'] = self.lang

        # Process items. This code is really specific for gametype == "whatletter".
        # We'll see what happens.
        self.json['items'] = []
        for y_item in self.yaml["items"]:
            j_item = {}
            try:
                j_item["id"] = y_item["id"]
            except KeyError:
                warning("item without an id in YAML file; skipping")
                continue

            
            (filename, image) = (None, None)
            for extension in FolksyOptions.image_extensions:
                try:
                    filename = os.path.join("images", j_item["id"] + extension)
                    image = PIL.Image.open(os.path.join(self.path, filename))
                except IOError:
                    continue
                else:
                    break

            if image is None:
                warning("no image file for item %s" % 

            # (self.json["width"], self.json["height"]) = PIL.Image.open(image_filename).size
            
            self.json['items'].append(j_item)

        # Dump JSON.
        filename = os.path.join(self.buildpath, "%s.json" % self.game_id)
        json.dump(self.json, open(filename, "w"))

class GameType:
    def __init__(self, _id):
        self.id = _id
        self.themes = set([])
        self.default_theme = None

    def __str__(self):
        return self.id

    def add_theme(self, themename, default = False):
        self.themes.add(themename)
        if (default):
            self.default_theme = themename
        
    def get_default_theme(self):
        return self.default_theme

    def is_valid_theme(self, t):
        return t in self.themes


class FolksyTool:
    paths_list = []
    games = {}
    gametypes = {}
    buildpath = ""

    def __init__(self):
        self.setup_gamepaths()
        self.setup_buildpath()
        self.setup_gametypes()

    def setup_gametypes(self):
        gametype = GameType("whatletter")
        gametype.add_theme("sunset", default = True)
        self.gametypes["whatletter"] = gametype

    # Class method
    def get_gametype(self, s):
        try:
            return self.gametypes[s]
        except KeyError:
            raise GameTypeError("not a valid gametype: " + s)

    def is_valid_gametype(g):
        # Only one so far...
        return g == "whatletter"

    def setup_gamepaths(self):
        # There should also be some default paths
        if(os.environ.has_key("FOLKSY_GAMEPATH")):
            self.paths_list += os.environ["FOLKSY_GAMEPATH"].split(os.pathsep)

        for path in self.paths_list:
            try:
                for game in subdirectories(path):
                    if not game.startswith("."):
                        self.games[game] = Game(self, game, os.path.join(path, game))
            except OSError as e:
                warning("%s: %s" % (e.filename, e.strerror))

    def setup_buildpath(self):
        # TODO: should of course be settable in all kinds of ways.
        self.buildpath = os.path.expanduser("~/.folksy/build")

    def list_games(self):
        if (len(self.games) == 0):
            print ("There are no games.")
        else:
            for name in self.games:
                print (name)

    def build_game(self, game_name):
        try:
            game = self.games[game_name]
        except KeyError as e:
            error("%s: No such game." % game_name);
            return

        try:
            game.load()
        except GameLoadError as e:
            error("%s: %s" % (game_name, e.strerror))
            return

        game.show_info()
        game.build()


    def main(self):
        parser = OptionParser()

        #parser.add_option("-h", "--help", help="get help")
        parser.add_option("-d", "--set-game-dir", help="set game directory to DIR",
                          dest="game_dir", metavar="DIR")
        parser.add_option("--pretty-json", help="pretty-print outputted JSON", dest="pretty_json")
        # TODO: actually care about these options...

        (options, args) = parser.parse_args()

        if (len(args) > 0):
            command = pop_first(args)

            if (command == "help"):
                print ("HERE: list all commmands");
            elif (command == "list"):
                self.list_games()
            elif (command == "build"):
                if (len(args) > 0):
                    game = pop_first(args)
                    self.build_game(game)
                else:
                    print ("Use as: folksy build [gamename] -- se folksy list for a list of games")
            else:
                print ("Unknown command: " + command)
        else:
            print ("Nothing to do. :-(");


#
# Utility functions.
#

def pop_first(array):
    element = array[0]
    del array[0]
    return element

def warning(s):
    sys.stderr.write(s + "\n")

Folksy_exit_code = 0
def error(s):
    global Folksy_exit_code
    Folksy_exit_code = 1
    sys.stderr.write(s + "\n")
    

def subdirectories(dir):
    for entry in os.listdir(dir):
        if os.path.isdir(os.path.join(dir, entry)):
            yield entry

if __name__ == "__main__":
    FolksyTool().main()
    sys.exit(Folksy_exit_code)

