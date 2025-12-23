# FHE Counter

Basic encrypted counter demonstrating increment and decrement operations

## Contents

1. [Overview](#overview)
2. [Core Features](#core-features)

---

## Overview

A simple counter using encrypted integers (euint32) to demonstrate basic FHE operations.

## Key Concepts

- **Encrypted State Storage**: Counter stored as encrypted value
- **FHE Arithmetic**: Addition and subtraction on encrypted values
- **Permission Management**: Using FHE.allowThis() and FHE.allow()

## Core Features

- Encrypted counter initialization
- Increment by encrypted value
- Decrement by encrypted value
- Proper permission grants
- Event emission for operations

