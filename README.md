# Display Preview Tool

A web-based tool to preview LCD displays to-scale before purchasing. Enter your desired screen specifications and see exactly how the display will look on your screen.

## Features

- **To-Scale Preview**: Displays are rendered at actual size based on your monitor's pixel density
- **Dual Input Modes**: 
  - Enter resolution directly (width × height in pixels)
  - Enter pixel density (PPI) to calculate resolution automatically
- **Comprehensive Information**: View screen diagonal, aspect ratio, total pixels, and more
- **Visual Gradient**: Each preview includes a colorful gradient matching the specified resolution
- **Device Bezel**: Preview includes device dimensions to show bezels around the screen

## Usage

1. Open `index.html` in your web browser
2. Fill in the display specifications:
   - **Screen Width/Height**: The actual display area in inches
   - **Device Width/Height**: The total device dimensions including bezels in inches
   - Choose input mode:
     - **Resolution Mode**: Enter horizontal and vertical resolution in pixels
     - **PPI Mode**: Enter pixel density, and resolution will be calculated automatically
3. Click "Generate Preview"
4. View your to-scale display preview with detailed specifications

## Example Specifications

### Laptop Display (13.3" Full HD)
- Screen: 13.3" × 7.5"
- Device: 14" × 9"
- Resolution: 1920 × 1080 px
- PPI: ~144

### Laptop Display (15.6" Full HD)
- Screen: 15.6" × 8.8"
- Device: 16" × 10"
- Resolution: 1920 × 1080 px
- PPI: ~141

### High-DPI Display (13.3" Retina)
- Screen: 13.3" × 7.5"
- Device: 14" × 9"
- PPI: 166 (calculates to 2208 × 1245)

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - Display calculations and rendering logic

## How It Works

The tool uses your monitor's pixel density (detected via `window.devicePixelRatio`) to convert physical dimensions (inches) into screen pixels, ensuring the preview is displayed at actual size. The gradient background is generated using HTML5 Canvas at the exact resolution specified, providing a visual representation of pixel density.

## License

MIT License - See LICENSE file for details