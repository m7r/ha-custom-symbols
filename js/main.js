const DOMAIN = "custom_symbols";
const ICON_STORE = {};
const CONFIG = {
  "-": "order",
  ":": "color",
  "#": "mode",
  "%": "breakPoint",
  b: {
    prefix: "monochrome",
  },
  v: {
    prefix: "monochrome",
    fade: 0.6,
  },
  h: {
    prefix: "hierarchical",
    secondary: "opacity: 0.5",
    tertiary: "opacity: 0.2",
    fade: 0.7,
  },
  p: {
    prefix: "hierarchical",
    primary: "fill: var(--cs-primary, currentColor)",
    secondary: "fill: var(--cs-secondary, var(--primary-color, #03a9f4))",
    tertiary: "fill: var(--cs-tertiary, var(--accent-color, #ff9800))",
    fade: 0.6,
  },
  m: {
    prefix: "multicolor",
    primary: "fill: var(--cs-primary, currentColor)",
    secondary: "fill: var(--cs-base, var(--primary-text-color, #000));",
    tertiary:
      "fill: var(--cs-base, var(--primary-text-color, #000)); opacity: 0.3",
    useFill: true,
    fade: 0.6,
  },
};

const noop = () => {};
const fetchJSON = async (url) => (await fetch(url)).json();
const compareOrder = (a, b) => a.order > b.order;
const getPath = (item) => item.path;
const combinePaths = (paths) =>
  paths.map((path) => path.getAttribute("d")).join(" ");

const getOption = (name, target) =>
  name.split(/([-:#%])/).reduce((target, value, idx, arr) => {
    const key = CONFIG[value];
    const val = arr[idx + 1];
    if (key) target[key] = val;
    return target;
  }, target);

const extractMode = (config) => (path) =>
  Array.from(path.classList)
    .filter((v) => v.startsWith(config.prefix))
    .map((name) => getOption(name, { path }));

const makeDynamic = (parts, value) => {
  const extras = [];
  return parts
    .map((item) => {
      if (value <= item.breakPoint) {
        const clear = item.mode == "clear";
        const extra = { ...item, color: item.color + "Fade", fade: clear - 2 };
        if (clear) extras.push(extra);
        else return extra;
      }
      return item;
    })
    .concat(extras);
};

const mergeColors = (parts) =>
  parts.reduce((target, part) => {
    const color = part.color ?? null;
    if (target.color !== color) {
      target.color = color;
      target.push((target.current = []));
    }
    target.current.push(part);
    return target;
  }, []);

const createStyle = (items, config) => {
  const last = items[items.length - 1];
  let styles = [];

  if (last.color) {
    const color = last.color.replace("Fade", "");
    const fill = config.useFill && (last.path.getAttribute("fill") || "#000");
    const style =
      config[color] ||
      (fill && `fill: var(--cs-${color}, ${fill.slice(0, 7)})`);
    if (style) styles.push(style);
    if (fill?.length > 7) {
      styles.push(`opacity: ${parseInt(fill.slice(7, 9), 16) / 255}`);
    }
  }

  if (last.fade) {
    styles.push(`opacity: ${Math.abs(1 + last.fade + config.fade)}`);
  }

  return styles.join("; ");
};

const preProcessIcon = async (iconSet, iconName) => {
  const [icon, suffix = ""] = iconName.split("#");
  const [type, value] = suffix.split(/(\d+)/);
  const hasValue = value !== undefined;
  const config = CONFIG[type[0]] || (hasValue ? CONFIG.v : CONFIG.b);
  let viewBox;
  let path = " ";
  let nodes = null;

  const data = await fetch(`/${DOMAIN}/icon/${iconSet}/${icon}.svg`);
  const text = await data.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  if (!doc || doc.documentElement.nodeName != "svg") return {};
  const svg = doc.documentElement;
  const paths = Array.from(svg.querySelectorAll("path"));

  viewBox = svg.getAttribute("viewBox");

  if (config) {
    let parts = paths.flatMap(extractMode(config)).sort(compareOrder);
    if (hasValue) parts = makeDynamic(parts, value);
    parts = mergeColors(parts);

    nodes = parts.map((items) => {
      const node = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const style = createStyle(items, config);
      if (style) node.setAttribute("style", style);
      node.setAttribute("d", combinePaths(items.map(getPath)));
      return node;
    });

    if (!config.primary && nodes.length == 1) {
      path = nodes[0].getAttribute("d");
      nodes = null;
    }
  }

  if (path === " " && !nodes) path = combinePaths(paths); // fallback for missing class

  return { path, viewBox, nodes };
};

async function getIconPath(icon) {
  const helper = document.createElement("ha-icon");
  helper.icon = icon;
  await helper._loadIcon();
  return helper._path;
}

async function getIconPathEntry([icon, name]) {
  const path = await getIconPath(icon);
  if (!path) console.error(`Custom Symbols: Invalid icon ${icon}`);
  return path && [path, await getIcon(...name.split(":"))];
}

async function createPathMap(iconMap) {
  const entries = await Promise.all(
    Object.entries(iconMap).map(getIconPathEntry)
  );
  return Object.fromEntries(entries.filter(Boolean));
}

const getIcon = async (iconSet, iconName) => {
  const icon = `${iconSet}:${iconName}`;
  if (!ICON_STORE[icon]) {
    ICON_STORE[icon] = preProcessIcon(iconSet, iconName);
  }
  return ICON_STORE[icon];
};

const getIconList = async (iconSet) => fetchJSON(`/${DOMAIN}/list/${iconSet}`);

if (!("customIcons" in window)) {
  window.customIcons = {};
}

window.customIcons["cs"] = {
  getIcon: (iconName) => getIcon("cs", iconName),
  getIconList: () => getIconList("cs"),
};

Promise.all([
  customElements.whenDefined("ha-icon"),
  customElements.whenDefined("ha-svg-icon"),
])
  .then(async () => {
    const iconMap = await fetchJSON(`/${DOMAIN}/replace/cs`);
    const pathMap = await createPathMap(iconMap);
    const HaIcon = customElements.get("ha-icon");
    const HaSvgIcon = customElements.get("ha-svg-icon");
    const pathDesc = Object.getOwnPropertyDescriptor(
      HaSvgIcon.prototype,
      "path"
    );
    const setPath = pathDesc.set;
    pathDesc.set = function (path) {
      if (path in pathMap) {
        const icon = pathMap[path];
        this._viewBox_ = this.viewBox;
        setPath.call(this, icon.path);
        this.setIcon(icon).catch(noop);
      } else {
        this.viewBox = this._viewBox_;
        delete this._viewBox_;
        setPath.call(this, path);
        this.clearPaths().catch(noop);
      }
    };
    Object.defineProperty(HaSvgIcon.prototype, "path", pathDesc);

    HaSvgIcon.prototype.clearPaths = async function () {
      await this.updateComplete;
      const svgGroup = this.shadowRoot.querySelector("g");
      while (svgGroup?.childElementCount > 1) {
        svgGroup.removeChild(svgGroup.lastChild);
      }
      return svgGroup;
    };

    HaSvgIcon.prototype.setIcon = async function ({
      nodes = [],
      viewBox = null,
    }) {
      const el = await this.clearPaths();
      if (viewBox != null) this.viewBox = viewBox;
      nodes.forEach((node) => el?.appendChild(node.cloneNode(true)));
    };

    HaIcon.prototype._setCustomPath = async function (promise, requestedIcon) {
      const icon = await promise;

      if (requestedIcon !== this.icon) return;

      this._path = icon.path;
      this._viewBox = icon.viewBox;

      if (icon.nodes) {
        await this.UpdateComplete;
        return this.shadowRoot.querySelector("ha-svg-icon")?.setIcon(icon);
      }
    };
  })
  .catch(console.error);
