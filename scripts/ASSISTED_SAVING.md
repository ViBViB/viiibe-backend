# Assisted Pin Saving Script

This script helps you populate your Pinterest boards semi-automatically while in Trial mode.

## What it does

1. **Searches** for pins using the Pinterest API
2. **Opens** each pin in your browser automatically
3. **You** just click "Save" and select the board
4. **Waits** for you to finish before moving to the next board

## How to use

### 1. Run the script

```bash
node scripts/assisted-pin-saving.js
```

### 2. For each board

The script will:
- Search for relevant pins
- Open them in browser tabs (one by one, with 2-second delays)
- Wait for you to save them all

### 3. For each pin tab

1. Click the **"Save"** button (red button on Pinterest)
2. Select the board from the dropdown (e.g., "Landing Pages")
3. Close the tab
4. Repeat for all tabs

### 4. Continue to next board

When you've saved all pins for a board:
- Press **Enter** in the terminal
- The script will move to the next board

## Tips

- **Don't rush**: Take your time with each board
- **Press Ctrl+C** to stop at any time
- **Resume later**: You can run the script multiple times
- **Duplicates**: Pinterest won't let you save the same pin twice

## Expected time

- ~5-10 pins per board
- ~10 boards total
- **Total time**: ~15-20 minutes

## After completion

Your boards will be populated and ready for testing the plugin!
