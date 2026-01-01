#!/bin/bash

# Splat Orbit Render - Linux/Mac Shell Script
# Quick start script for Linux and Mac users

echo "========================================"
echo "Splat Orbit Render - Quick Start"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Checking dependencies..."
echo ""

# Check if puppeteer is installed
if [ ! -d "node_modules/puppeteer" ]; then
    echo "Installing Puppeteer..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if splat-transform is installed
if ! command -v splat-transform &> /dev/null; then
    echo ""
    echo "WARNING: splat-transform CLI is not installed"
    echo "Installing globally..."
    npm install -g @playcanvas/splat-transform
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install splat-transform"
        echo "Please run: npm install -g @playcanvas/splat-transform"
        exit 1
    fi
fi

echo ""
echo "========================================"
echo "All dependencies are ready!"
echo "========================================"
echo ""
echo "Usage examples:"
echo ""
echo "1. Basic usage:"
echo "   node index.mjs input.ply"
echo ""
echo "2. Custom settings:"
echo "   node index.mjs input.ply -f 72 -r 10 -o ./frames"
echo ""
echo "3. Show help:"
echo "   node index.mjs --help"
echo ""
echo "For more information, see README.md"
echo ""
