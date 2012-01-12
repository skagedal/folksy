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

from optparse import OptionParser

def main():
    parser = OptionParser()

    parser.add_option("-h", "--help", help="get help")
    parser.add_option("-d", "--set-game-dir", help="set game directory to DIR",
                      dest="game_dir", metavar="DIR")

    (options, args) = parser.parse_args()

    if (len(args) > 0):
        command = args[0]
        del (args[0])
        if (command == "help"):
            print ("HERE: list all commmands");
        elif (command == "list"):
            print ("HERE: list all games")
        elif (command == "compile"):
            print ("HERE: compila a game")
        else:
            print ("Unknown command: " + command)
    else:
        print ("Nothing to do. :-(");

if __name__ == "__main__":
    main()
