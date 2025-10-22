# Bouncing Pixels - Streamer Toolkit by TeeTohr

## Installation

Extract all files to a folder (e.g., C:\OBS\SETUP\)

## Adding to OBS

### Step 1: Add the Bouncing Pixels Source
1. In OBS, add a new Browser Source
2. Name it whatever you want (e.g. "Bouncing Pixels", etc.)
3. Set the path of the BouncingImage.html file as the URL (e.g. C:\OBS\SETUP\Bouncing Pixels - Streamer Toolkit by TeeTohr\BouncingImage.html) (do not Check "Local file")
4. Set dimensions (recommended: dimensions of your canvas size)
5. IMPORTANT: Check "Shutdown source when not visible" to prevent performance issues
6. Click OK

### Step 2: Add the Control Dock
1. In OBS menu, go to Docks → Custom Browser Docks
2. Dock Name: "Bouncing Pixels" (or any name you prefer)
3. Set the path of the Dock.html file as the URL (e.g. C:\OBS\SETUP\Bouncing Pixels - Streamer Toolkit by TeeTohr\Dock.html)
4. Click "Apply"
5. The control dock should appear - you can dock it anywhere in OBS





## Using Custom Images / Corner Effects

1. Place your images in the /images and/or /corner_effects folder
2. Name them as: custom.png, custom.jpg, custom.gif, custom.webp, or custom.svg
3. Select them from the Image/Corner Effects dropdown in the Settings tab
4. Supported formats: PNG, JPG, GIF (animated), WebP (animated), SVG





## Troubleshooting

Dock doesn't control the logo:
- Make sure both the Browser Source and Dock are loaded (refresh both if needed)
- Check that both files are in the same folder (all files should stay in their original folder)
- Right-click on the Browser Source → Interact, then try the Dock again

Image not loading:
- Check that the image file exists in /images folder
- Verify the filename matches exactly (case-sensitive)
- Status will show "Image Not Found" if there's an error

Colors not changing:
- Make sure "No change" filter is not selected
- Try resetting to apply the current filter
- Some filters work better with certain image types

Settings not persisting:
- Settings are saved in browser localStorage
- If using OBS on multiple PCs, settings are per-machine
- Clearing browser cache will reset all settings

## Notes

- All settings are automatically saved and restored on OBS restart or scene selection
- The logo will bounce within the browser source dimensions
- Performance impact is minimal even with animated images
- No internet connection required - everything runs locally and completely offline
- Settings are per-computer (if you use OBS on multiple PCs, settings won't sync)
- The DVD logo is copyrighted due to being a trademark owned by DVD FLLC, as such it isn't included in this tool
- This tool is to be used for entertainment only, each user's choice of picture is their own responsibility
- The logo moves once per frame, so the speed of logo is framerate dependant
- A quick explanation on version numbers : W.X.Y.Z
	- W : Major version (big revamp or features)
	- X : Minor version (small revamp or features)
	- Y : Bugfix version
	- Z : Misc changes (labels, etc)

- If you happen to use this in your streams or video please send me a clip on X/Twitter at @TeeTohr (in dms is fine :) ) 

Enjoy !



AI Disclaimer : AI was used as a coding assistant / code generator for this toolkit. However all visual and audio assets bundled with the toolkit were made by hand which is why they are VERY simple I am not an artist at all !