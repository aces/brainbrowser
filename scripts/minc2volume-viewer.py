#!/usr/bin/env python3
#
# BrainBrowser: Web-based Neurological Visualization Tools
# (https://brainbrowser.cbrain.mcgill.ca)
#
# Copyright (C) 2011 McGill University 
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Author: Jon Pipitone <jon@pipitone.ca>
# Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
# Author: Nicolas Kassis

import sys
import shutil
import os.path
import argparse
import subprocess
import json

required_minc_cmdline_tools = ['mincinfo', 'minctoraw'] 

def console_error(message, exit_code): 
    print(message, file=sys.stderr)
    sys.exit(1)

def console_log(message):
    print(message)

def check_minc_tools_installed(): 
    for tool in required_minc_cmdline_tools:
        if not shutil.which(tool): 
            console_error(
              "minc2volume-viewer.py requires that the MINC tools be installed.\n"
              "Visit http://www.bic.mni.mcgill.ca/ServicesSoftware/MINC for info.", 1)

def cmd(command): 
    return subprocess.check_output(command.split(), universal_newlines=True).strip()

def get_space(mincfile, space): 
    header = {
        "start" : float(cmd("mincinfo -attval {}:start {}".format(space,mincfile))),
        "space_length" : float(cmd("mincinfo -dimlength {} {}".format(space,mincfile))),
        "step" : float(cmd("mincinfo -attval {}:step {}".format(space,mincfile))),
    }

    cosines = cmd("mincinfo -attval {}:direction_cosines {}".format(space,mincfile))
    cosines = cosines.strip().split()
    if len(cosines) > 1:
        header["direction_cosines"] = list(map(float, cosines))

    return header

def make_header(mincfile, headerfile): 
    header = {}

    # find dimension order
    order = cmd("mincinfo -attval image:dimorder {}".format(mincfile))
    order = order.split(",")

    if len(order) < 3 or len(order) > 4:
        order = cmd("mincinfo -dimnames {}".format(mincfile))
        order = order.split(" ")
   
    header["order"] = order

    if len(order) == 4: 
        time_start  = cmd("mincinfo -attval time:start {}".format(mincfile))
        time_length = cmd("mincinfo -dimlength time {}".format(mincfile))
        
        header["time"] = { "start" : float(time_start), 
                           "space_length" : float(time_length) }

    # find space
    header["xspace"] = get_space(mincfile,"xspace")
    header["yspace"] = get_space(mincfile,"yspace")
    header["xspace"] = get_space(mincfile,"xspace")

    if len(order) > 3:
        header["time"] = get_space(mincfile,"time")

    # write out the header
    open(headerfile,"w").write(json.dumps(header))

def make_raw(mincfile, rawfile): 
    raw = open(rawfile, "wb")
    raw.write( 
        subprocess.check_output(["minctoraw","-byte","-unsigned","-normalize",mincfile]))
        
def main(filename): 
    if not os.path.isfile(filename):
        console_error("File {} does not exist.".format(filename))

    check_minc_tools_installed()

    basename = os.path.basename(filename)
    headername = "{}.header".format(basename)
    rawname = "{}.raw".format(basename)

    console_log("Processing file: {}".format(filename))

    console_log("Creating header file: {}".format(headername))
    make_header(filename, headername)

    console_log("Creating raw data file: {}".format(rawname))
    make_raw(filename, rawname)

if __name__ == '__main__': 
    parser = argparse.ArgumentParser()
    parser.add_argument("filename")
    args = parser.parse_args()

    main(args.filename)
