#!/usr/bin/env bash
#
# Run `yarn hardhat flatten` on all .sol files recursively in the contracts/ directory
# and store the output in the flattened/ directory. Also create all parent directories
# before writing the output if they don't exist.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
usage="Usage: $0"

set -o errexit

# Ensure the contracts/ directory exists.
contracts_dir="${script_dir}/contracts"
if [ ! -d "${contracts_dir}" ]; then
  echo "The contracts/ directory does not exist. ${usage}"
  exit 1
fi

# Ensure the flattened/ directory exists.
flattened_dir="${script_dir}/flattened"
mkdir -p "${flattened_dir}"

# Flatten all .sol files in the contracts/ directory.
find "${contracts_dir}" -type f -name "*.sol" -print0 | while IFS= read -r -d $'\0' file; do
  # Get the relative path of the file.
  relative_path="${file#${contracts_dir}/}"
  # Get the directory of the file.
  file_dir="$(dirname "${flattened_dir}/${relative_path}")"
  # Create the directory if it doesn't exist.
  mkdir -p "${file_dir}"
  # Flatten the file.
  yarn hardhat flatten "${file}" > "${flattened_dir}/${relative_path}"
done
