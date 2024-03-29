[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

# Home Assistant Custom Symbols

## Install

### HACS (Recommended)

1. **HACS** tab > Menu > **Custom Repository**
2. Paste this repo's URL
3. Select **Integration** in the dropdown
4. Install **custom_symbols** from HACS
5. Restart Home Assistant
6. Home Assistant > Settings > Integrations > Add > Custom Symbols > Install
7. Add your own svg files to folder /config/custom_symbols

The icons should be usable in Home Assistant now. If it doesnt show up, try refreshing the page, private browsing or restart Home Assistant.

### Manual

1. Copy `custom_components/custom_symbols` into your custom_components folder
2. Restart Home Assistant
3. Home Assistant > Settings > Integrations > Add > Custom Symbols > Install
4. Add your own svg files to folder /config/custom_symbols

The icons should be usable in Home Assistant now. If it doesnt show up, try refreshing the page, private browsing or restart Home Assistant

## Features

- Supports Home Assistant's icon picker (2021.11.0+)
- Replace icon by name, configure in settings menu
- Only one example SVG file included, please use our own files
- Rendering Modes
  - Monochrome
  - Hierarchical **#h**
  - Palette **#p**
  - Multicolor **#m**
  - Variable Color **#h20** , **#20**

## Usage

- Prefix: **cs**
- Suffix: **#[mode[value]]**
- Eg:
  - SVG files in config/custom_symbols:
    - bed.double.svg
    - ha.svg
  - **cs:bed.double** | **cs:ha#h** | **cs:ha#40** | **cs:ha#m40**

## Prepare SVG

The rendering is inspired by [Apple: SF Symbols](https://developer.apple.com/sf-symbols/).

The easiest way to create svg files is the SF Symbol App and an [prepare script](https://github.com/m7r/ha-custom-symbols-prepare).

### Apply Styles

Class names define how the element should be rendered.  
An name has this parts
`[mode]-[order]:[color]#clear%[break point]`. Everything after order is optional

Mode key words

- monochrome
- multicolor
- hierarchical (used for palette too)

Break point defines until which value in percent the object should be semi transparent.  
Clear is only used for variable color rendering to clear the background under the transparent object.

**Attention**: At least the monochrome class is required!

Eg included ha.svg:

```xml
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="2.38 -90 108 108">
  <path class="monochrome-0 multicolor-0:cyan hierarchical-0:tertiary" fill="#55BEF0" d="M20 …"/>
  <path class="monochrome-1#clear%0 multicolor-1:white%0 hierarchical-1:primary%0" fill="#FFFFFF" d="M56 …"/>
  <path class="monochrome-2#clear%34 multicolor-2:white%34 hierarchical-2:primary%34" fill="#FFFFFF" d="M45 …"/>
  <path class="monochrome-3#clear%68 multicolor-3:white%68 hierarchical-3:primary%68" fill="#FFFFFF" d="M74 …"/>
</svg>
```

### Color Theme

The colors for palette and multicolor can be overwritten with css variables in your theme

- cs-primary: currentColor
- cs-secondary: var(--primary-color)
- cs-tertiary: var(--accent-color)
- cs-base: var(--primary-text-color)
- and for each multicolor:**name**
  - cs-**name**: [fill value]

## Security

The SVG is parsed and only the d attribute is transfered to a new path node.
The class and fill attribute only define the style of a generated path.

## Limitation

- Does not work together with other icon libs which modify custom icon rendering. Eg. hass-fontawesome
