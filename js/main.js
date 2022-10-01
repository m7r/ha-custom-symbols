const DOMAIN = "custom_symbols"
const ICON_STORE = {}
const CONFIG = {
  '-': 'order',
  ':': 'color',
  '#': 'mode',
  '%': 'breakPoint',
  d: {
    prefix: 'monochrome',
    fade: 0.6
  },
  h: {
    prefix: 'hierarchical',
    secondary: 'opacity: 0.5',
    tertiary: 'opacity: 0.2',
    fade: 0.7
  },
  p: {
    prefix: 'hierarchical',
    primary: 'fill: var(--cs-primary, currentColor)',
    secondary: 'fill: var(--cs-secondary, var(--primary-color, #03a9f4))',
    tertiary: 'fill: var(--cs-tertiary, var(--accent-color, #ff9800))',
    fade: 0.6
  },
  m: {
    prefix: 'multicolor',
    primary: 'fill: var(--cs-primary, currentColor)',
    secondary: 'fill: var(--cs-base, var(--primary-text-color, #000)); opacity: 0.5',
    tertiary: 'fill: var(--cs-base, var(--primary-text-color, #000)); opacity: 0.2',
    useFill: true,
    fade: 0.6
  }
}

const compareOrder = (a, b) => a.order > b.order
const getColor = item => item.color
const getPath = item => item.path

const group = (arr, fn) => arr.reduce((target, value, idx, arr) => {
  const key = String(fn(value, idx, arr))
  if (key in target) target[key].push(value)
  else target[key] = [value]
  return target
}, Object.create(null))

const mergeParts = parts => Object.values(group(parts, getColor))
const combinePaths = paths => paths.map(path => path.getAttribute('d')).join(' ')
const isMonochrome = path => String(path.classList).includes(CONFIG.d.prefix)

const getOption = (name, target) =>
  name.split(/([-:#%])/)
      .reduce((target, value, idx, arr) => {
        const key = CONFIG[value]
        const val = arr[idx + 1]
        if (key) target[key] = val
        return target
      }, target)

const extractMode = config => path =>
  Array.from(path.classList)
      .filter(v => v.startsWith(config.prefix))
      .map(name => getOption(name, {path}))

const makeDynamic = value => item => {
  if (value <= item.breakPoint) {
    const clear = item.mode == 'clear'
    const extra = { ...item, color: item.color + 'Fade', fade: clear - 2 }
    return clear ? [item, extra] : extra
  }
  return item
}
 
const createStyle = (items, config) => {
  const last = items[items.length -1]
  let style = ''

  if (last.color) {
    const color = last.color.replace('Fade', '')
    style += config[color] || (config.useFill && `fill: var(--cs-${color}, ${last.path.getAttribute('fill')})`)
  }

  if (last.fade) style += `; opacity: ${Math.abs(1 + last.fade + config.fade)}`

  return style
}

const preProcessIcon = async (iconSet, iconName) => {
  const [icon, suffix = ''] = iconName.split("#")
  const [type, value] = suffix.split(/(\d+)/)
  const hasValue = value !== undefined
  const config = CONFIG[type[0]] || (hasValue && CONFIG.d)
  let viewBox
  let path = ''
  let nodes = null
  
  const data = await fetch(`/${DOMAIN}/icon/${iconSet}/${icon}.svg`)
  const text = await data.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'image/svg+xml')
  
  if (!doc || doc.documentElement.nodeName != 'svg') return {}
  const svg = doc.documentElement
  const paths = Array.from(svg.querySelectorAll('path'))

  viewBox = svg.getAttribute('viewBox')

  if (config) {
    let parts = paths.flatMap(extractMode(config)).sort(compareOrder)

    if (hasValue) parts = parts.flatMap(makeDynamic(value))

    const length = parts.length

    if (length == 1 && (config == CONFIG.d || config == CONFIG.h)) {
      path = parts[0].path.getAttribute('d')
    }

    if (length && !path) {
      nodes = mergeParts(parts).map(items => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const style = createStyle(items, config)
        if (style) node.setAttribute('style', style)
        node.setAttribute('d', combinePaths(items.map(getPath)))
        return node
      })
    }
  }

  if (!path && !nodes) path = combinePaths(paths.filter(isMonochrome)) 

  return { path, viewBox, nodes }
};

const getIcon = async (iconSet, iconName) => {
  const icon = `${iconSet}:${iconName}`;
  if (!ICON_STORE[icon]) { 
    ICON_STORE[icon] = preProcessIcon(iconSet, iconName)
  }
  return ICON_STORE[icon]
};

const getIconList = async (iconSet) => {
  const data = await fetch(`/${DOMAIN}/list/${iconSet}`);
  const text = await data.text();
  return JSON.parse(text);
}

if (!('customIcons' in window)) {
  window.customIcons = {}
}

window.customIcons['cs'] = {
  getIcon: (iconName) => getIcon('cs', iconName),
  getIconList: () => getIconList('cs'),
}

customElements.whenDefined('ha-icon').then(() => {
  const HaIcon = customElements.get('ha-icon')

  HaIcon.prototype._setCustomPath = async function (promise, requestedIcon) {
    const icon = await promise

    if (requestedIcon !== this.icon) return

    this._path = icon.path
    this._viewBox = icon.viewBox

    if (icon.nodes) {
      await this.UpdateComplete;
      const el = this.shadowRoot.querySelector('ha-svg-icon')
      if (!el) return

      await el.updateComplete

      const root = el.shadowRoot.querySelector('g')
      if (!root) return
      icon.nodes.forEach(node => root.appendChild(node.cloneNode(true)))
    }
  };
});
