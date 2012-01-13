#!/usr/bin/python2.6
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
import os.path
from optparse import OptionParser

class FolksyTool:
    paths_list = []
    games_list = []

    def __init__(self):
        self.setup_gamepaths()

    def setup_gamepaths(self):
        # There should also be some default paths
        if(os.environ.has_key("FOLKSY_GAMEPATH")):
            self.paths_list += os.environ["FOLKSY_GAMEPATH"].split(os.pathsep)

        for path in self.paths_list:
            try:
                for game in subdirectories(path):
                    if not game.startswith("."):
                        self.games_list.append((game, path))
            except OSError as e:
                warning("%s: %s", e.filename, e.strerror)


    def list_games(self):
        if (len(self.games_list) == 0):
            print ("There are no games.")
        else:
            for (game, path) in self.games_list:
                print (game)

    def compile_game(self, game_name):
        pass

    def main(self):
        parser = OptionParser()

        #parser.add_option("-h", "--help", help="get help")
        parser.add_option("-d", "--set-game-dir", help="set game directory to DIR",
                          dest="game_dir", metavar="DIR")

        (options, args) = parser.parse_args()

        if (len(args) > 0):
            command = pop_first(args)

            if (command == "help"):
                print ("HERE: list all commmands");
            elif (command == "list"):
                self.list_games()
            elif (command == "compile"):
                print ("HERE: compile a game")
                if (len(args) > 0):
                    game = pop_first(args)
                    self.compile_game(game)
            else:
                print ("Unknown command: " + command)
        else:
            print ("Nothing to do. :-(");

    def compile_game(self, game):
        pass
#
# Utility functions.
#

def pop_first(array):
    element = array[0]
    del array[0]
    return element

def warning(s):
    sys.stderr.write(s)

def subdirectories(dir):
    for entry in os.listdir(dir):
        if os.path.isdir(os.path.join(dir, entry)):
            yield entry

if __name__ == "__main__":
    FolksyTool().main()
