#!/usr/bin/env bash
pwd=$(pwd)
build_folder="${pwd}/build"
mkdir -p "${build_folder}/packed"
cd "${build_folder}/unpacked"
echo "$(pwd)"
for folder in $(ls .)
do
  zip -ry "${build_folder}/packed/${folder}.{zip|dmg}" "${folder}"
done
cd "${pwd}"