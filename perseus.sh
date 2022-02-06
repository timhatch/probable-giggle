#!/bin/bash

# Perseus run script
# Basic scripting guide is here:
# https://likegeeks.com/linux-bash-scripting-awesome-guide-part3/#Bash-Scripting-Options

MSG="Usage: script options: -d|p for development/production with parameters: start|stop \ne.g. ./perseus.sh -d start\n"

# Provide a help message if the script was called without options or parameters
if ! [ -n "$1" ] ; then printf "$MSG" ; fi

# If options were provided, handle them
while [ -n "$1" ]
do
  case "$1" in

  # TODO: Re-implment for any new reverse proxy
  # Run in production mode - spin up a thin instance on port 5000
  -p) param=$2
    if ! [ -n "$param" ] ; then echo "start|stop required"
    elif [ $param = "start" ] ; then
      thin -s 1 -C config.yml -R config.ru start
    elif [ $param = "stop" ] ; then
      thin -s 1 -C config.yml stop
    fi
    shift ;;

  # Run in development mode - spin up a thin instance on port 5000
  -d) param="$2"
    if ! [ -n "$param" ] ; then echo "start|stop required"
    elif [ $param = "start" ] ; then
      thin -s 1 -C config.yml -R config.ru start
    elif [ $param = "stop" ] ; then
      thin -s 1 -C config.yml stop
    fi
    shift ;;
  
  # Handle unknown options
  *) 
    printf "$MSG"
    shift ;;
  esac
  shift
done