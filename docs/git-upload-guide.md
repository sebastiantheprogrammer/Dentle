# Git Upload Guide

## First Time Upload

From the Dentle folder:

```bash
cd "/Users/sebastianingram/Coding Projects/Dentle"
git init
git add .
git commit -m "Initial Dentle launch build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with the GitHub repo you create.

## Normal Updates After That

```bash
cd "/Users/sebastianingram/Coding Projects/Dentle"
git status
git add .
git commit -m "Describe what changed"
git push
```

## Important

Do not commit `.env.local`.

This project already ignores `.env.local`, `.env`, `.next`, and `node_modules`.

If GitHub asks you to sign in from the terminal, use GitHub Desktop or authenticate with the GitHub CLI.
