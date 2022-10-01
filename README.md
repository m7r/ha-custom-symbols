[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# Home Assistant Custom Symbols

## Install
### HACS (Recommended)
1. **HACS** tab > Menu > **Custom Repository**
4. Paste this repo's URL
5. Select **Integration** in the dropdown
6. Install **custom_symbols** from HACS
7. Create folder config/custom_symbols
8. Copy your svg files to folder config/custom_symbols
9. Restart Home Assistant
10. Home Assistant > Settings > Integrations > Add > Custom Symbols > Install

The icons should be usable in Home Assistant now. If it doesnt show up, try refreshing the page, private browsing or restart Home Assistant.

### Manual
1. Copy `custom_components/custom_symbols` into your custom_components folder
2. Create folder config/custom_symbols
3. Copy your svg files to folder config/custom_symbols
4. Restart Home Assistant
5. Home Assistant > Settings > Integrations > Add > Custom-Symbols > Install
  
The icons should be usable in Home Assistant now. If it doesnt show up, try refreshing the page, private browsing or restart Home Assistant

## Features

 - Supports Home Assistant's icon picker (2021.11.0+)
 - SVG files are **not** included, please use our own files
 - Rendering Modes
   - Monochrome
   - Hierarchical **#h**
   - Palette **#p**
   - Multicolor **#m**
   - Dynamic Value **#h20** , **#20**
  

## Usage
 - Prefix: **cs**
 - Suffix: **#[mode[value]]**
 - SVG in config/custom_symbols:
   - lightbulb.svg
   - bed.double.svg
 - Eg: **cs:bed.double** | **cs:lightbulb#h** | **cs:speaker.2.waves#25** | **cs:speaker.2.waves#m25**


## Prepare SVG

The rendering is inspired by [Apple: SF Symbols](https://developer.apple.com/sf-symbols/) exported svg.

Class names define how the element should be rendered.  
An name has this parts
```[mode]-[order]:[color]#clear%[break point]```. Everything after order is optional

Mode key words
  - monochrome
  - multicolor
  - hierarchical (used for palette too)

Break point defines until witch percent value the object should be semi transparent.  
Clear is only used for dynamic rendering to clear the background under the transparent object in the same color.

**Attention**: At least the monochrome class is required!

Eg:
``` xml
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-0.61 -90 108 108">
  <path class="monochrome-0 multicolor-0:beige hierarchical-0:primary" fill="#DEBB93" d="M56 …">
  <path class="monochrome-1 multicolor-1:red hierarchical-1:primary" fill="#FF3B30" d="M25 …"/>
  <path class="monochrome-2 multicolor-2:yellow hierarchical-2:primary" fill="#FFCC00" d="M40 …"/>
  <path class="monochrome-3 multicolor-3:green hierarchical-3:primary" fill="#28CD41" d="M60 …"/>
</svg>
```

### Testing

If you have nodejs installed and download this repository you can run `npm run test -- [path to your local svg folder]`
and open the URL in your browser to preview all your svg.

### Color Theme

The colors for palette and multicolor can be overwritten with css variables in your theme

  - cs-primary: currentColor
  - cs-secondary: var(--primary-color)
  - cs-tertiary: var(--accent-color)
  - cs-base: var(--primary-text-color)
  - and for each multicolor:name
    - cs-name: [fill value]

## Security

The SVG is parsed and only the d attribute is transfered to a new path node.
The class and fill attribute only define the style of a generated path.

## Limitation

 - Does not work together with other icon libs which modify custom icon rendering. Eg. hass-fontawesome
 