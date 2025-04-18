#!/usr/bin/env bash
#
# Builds a package containing both artifacts and source code.
#
# Example package structure:
#
#   my-package/
#     artifacts/
#       ... (output from yarn hardhat compile)
#     sources/
#       contracts/
#         ... (source code)
#       @openzeppelin/
#         ... (source code)
#       ... (other dependencies)
#
# Usage:
#
#   ./build-package.sh <output-dir>

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
usage="Usage: $0 <output-dir>"

set -o errexit
set -o nounset
set -o pipefail

# Ensure the output directory is provided using parameter expansion.
output_dir="${1:?Please provide an output directory. ${usage}}"
mkdir -p "${output_dir}"

# Copy the ${script_dir}/artifacts/ directory into the output directory.
cp -r "${script_dir}/artifacts" "${output_dir}"

# Flatten all .sol files in the contracts/ directory.
"${script_dir}/flatten-all.sh"

# Copy the ${script_dir}/flattened/ directory into the sources directory.
sources_dir="${output_dir}/sources"
mkdir -p "${sources_dir}"
cp -r "${script_dir}/flattened" "${sources_dir}"

# Copy dependencies into the sources directory.
mkdir -p "${sources_dir}/@openzeppelin"
cp -r "${script_dir}/node_modules/@openzeppelin/contracts" "${sources_dir}/@openzeppelin/contracts"
rm -rf "${sources_dir}/@openzeppelin/contracts/node_modules"
