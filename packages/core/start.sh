#!/bin/bash
# Start SecuClaw Backend
cd "$(dirname "$0")"
exec bun src/main.ts
