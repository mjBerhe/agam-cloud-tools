#!/bin/bash

# Get the current directory
current_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

windows_path=$(cygpath -w "$current_dir")

# Path to the config.json
config_file="$current_dir/config.json"

# Extract pythonVersion from config.json
python_version=$(grep -oP '(?<="pythonVersion": ")[^"]*' "$config_file")

echo "Current dir: $windows_path"
echo "Config: $config_file"
echo "Using Python version: $python_version"
echo "Cleaning using: $windows_path/clean_sh_files.sh"

# Run the Python script and create a new log file
python$python_version "$windows_path/shGenerator.py" > "$windows_path/log.log" 2>&1

# Run the clean_sh_files.sh script and append output to log file
bash "$windows_path/clean_sh_files.sh" >> "$windows_path/log.log" 2>&1

# Pause equivalent in bash (optional)
read -p "Press any key to continue..."