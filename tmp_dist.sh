#!/usr/bin/env sh

# create dist in /tmp to save some SSD write cycles! (if /tmp is mounted using tmpfs)

d=$(mktemp -d --tmpdir)
ln -fs "$d" dist
