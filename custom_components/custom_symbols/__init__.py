"""The Custom Symbols integration."""

from __future__ import annotations

from os import scandir

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.http.view import HomeAssistantView
from homeassistant.config_entries import ConfigEntry, ConfigType
from homeassistant.core import HomeAssistant

from .const import DIR, DOMAIN
from .mapping import mapping_get

DATA_EXTRA_MODULE_URL = "frontend_extra_module_url"
LOADER_URL = f"/{DOMAIN}/main.js"
LOADER_PATH = f"{DIR}/main.js"
ICON_URL = f"/{DOMAIN}/icon/cs"
ICONLIST_URL = f"/{DOMAIN}/list/cs"
ICONREPLACEMENT_URL = f"/{DOMAIN}/replace/cs"


def listSymbols(dir: str):
    """List svg file name of dir. Function is blocking."""
    with scandir(dir) as it:
        return [
            {"name": entry.name[:-4]}
            for entry in it
            if entry.name.endswith(".svg") and entry.is_file()
        ]


class ListingView(HomeAssistantView):
    """HTTP endpoint for list of symbol names."""

    requires_auth = False

    def __init__(self, url, iconpath, hass: HomeAssistant) -> None:
        """Init listing view."""
        self.url = url
        self.iconpath = iconpath
        self.hass = hass
        self.name = "Icon Listing"

    async def get(self, request):
        """Send json list of symbol names from file names."""
        symbols = await self.hass.async_add_executor_job(listSymbols, self.iconpath)
        return self.json(symbols)


class ReplacementView(HomeAssistantView):
    """HTTP endpoint for replacement map."""

    requires_auth = False

    def __init__(self, url: str, entry: ConfigEntry) -> None:
        """Init replacement view."""
        self.url = url
        self.entry = entry
        self.name = "Icon Replacement Map"

    async def get(self, request) -> str:
        """Send map from options."""
        return self.json(mapping_get(self.entry))


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register http end points."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(LOADER_URL, hass.config.path(LOADER_PATH), True),
            StaticPathConfig(ICON_URL, hass.config.path(DOMAIN), True),
        ]
    )
    add_extra_js_url(hass, LOADER_URL)
    hass.http.register_view(ListingView(ICONLIST_URL, hass.config.path(DOMAIN), hass))
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register HTTP endpoint for replacement map."""
    hass.http.register_view(ReplacementView(ICONREPLACEMENT_URL, entry))
    return True
