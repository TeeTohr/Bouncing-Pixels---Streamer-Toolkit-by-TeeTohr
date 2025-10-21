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





## Using Custom Images

1. Place your images in the /images folder
2. Name them as: custom.png, custom.jpg, custom.gif, custom.webp, or custom.svg
3. Select them from the Image dropdown in the Settings tab
4. Supported formats: PNG, JPG, GIF (animated), WebP (animated), SVG

## Controls

### Controls Tab:
- Pause/Start: Toggle animation
- Reset: Reset position and randomize direction
- Hide/Show: Toggle visibility
- Speed: Adjust movement speed
- Scale: Change image size in pixels

### Settings Tab:
- Color Change Filter: Choose how colors change on bounce
  - Hue colors: Shifts through color spectrum
  - Simple color: Applies tinted overlays
  - Grey level: Varies brightness in grayscale
  - Solid color: Uses 15 preset colors (primaries, secondaries, etc.)
  - No change: Disables color effects
- Color Intensity: Controls saturation
- Number of logos: How many of the same images to display
- Image: Select which image to display
- Image Scaling: Choose an upscaling algorithm, useful to avoid blurring pixel art for example




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

- If you happen to use this in your streams or video please send me a clip on X/Twitter at @TeeTohr (in dms is fine :) ) 

Enjoy !