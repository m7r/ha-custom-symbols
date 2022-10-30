"""The Custom Symbols integration."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry, ConfigType
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http.view import HomeAssistantView

from os import walk, path
from .const import DOMAIN, DIR
from .mapping import mapping_get

DIR = path.dirname(path.realpath(__file__))
DATA_EXTRA_MODULE_URL = 'frontend_extra_module_url'
LOADER_URL = f'/{DOMAIN}/main.js'
LOADER_PATH = f'{DIR}/main.js'
ICON_URL = f'/{DOMAIN}/icon/cs'
ICONLIST_URL = f'/{DOMAIN}/list/cs'
ICONREPLACEMENT_URL = f'/{DOMAIN}/replace/cs'
ICON_PATH = 'custom_symbols'


class ListingView(HomeAssistantView):
    """HTTP endpoint for list of symbol names"""
    requires_auth = False

    def __init__(self, url, iconpath) -> None:
        self.url = url
        self.iconpath = iconpath
        self.name = "Icon Listing"

    async def get(self, request):
        """Send list of symbol names from file names"""
        icons = []
        for (dirpath, _, filenames) in walk(self.iconpath):
            icons.extend(
                [
                    {
                        "name": path.join(dirpath[len(self.iconpath):], fn[:-4])
                    } for fn in filenames if fn.endswith(".svg")
                ]
            )
        return self.json(icons)


class ReplacementView(HomeAssistantView):
    """HTTP endpoint for replacement map"""
    requires_auth = False

    def __init__(self, url: str , entry: ConfigEntry)  -> None:
        self.url = url
        self.entry = entry
        self.name = "Icon Replacement Map"

    async def get(self, request) -> str:
        """Send map from options"""
        return self.json(mapping_get(self.entry))


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register http end points"""
    hass.http.register_static_path(
        LOADER_URL,
        hass.config.path(LOADER_PATH),
        True
    )
    add_extra_js_url(hass, LOADER_URL)

    hass.http.register_static_path(
        ICON_URL,
        hass.config.path(ICON_PATH),
        True
    )

    hass.http.register_view(
        ListingView(
            ICONLIST_URL,
            hass.config.path(ICON_PATH)
        )
    )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register HTTP endpoint for replacement map"""
    hass.http.register_view(
        ReplacementView(
            ICONREPLACEMENT_URL,
            entry
        )
    )

    return True
