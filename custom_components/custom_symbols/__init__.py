from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http.view import HomeAssistantView

from os import walk, path

DOMAIN = "custom_symbols"

DATA_EXTRA_MODULE_URL = 'frontend_extra_module_url'
LOADER_URL = f'/{DOMAIN}/main.js'
LOADER_PATH = f'custom_components/{DOMAIN}/main.js'
ICON_URL = f'/{DOMAIN}/icon/cs'
ICONLIST_URL = f'/{DOMAIN}/list/cs'
ICON_PATH = 'custom_symbols'


class ListingView(HomeAssistantView):
    requires_auth = False

    def __init__(self, url, iconpath):
        self.url = url
        self.iconpath = iconpath
        self.name = "Icon Listing"

    async def get(self, request):
        icons = []
        for (dirpath, dirnames, filenames) in walk(self.iconpath):
            icons.extend(
                [
                    {
                        "name": path.join(dirpath[len(self.iconpath):], fn[:-4])
                    } for fn in filenames if fn.endswith(".svg")
                ]
            )
        return self.json(icons)


async def async_setup(hass, config):
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


async def async_setup_entry(hass, entry):
    return True


async def async_remove_entry(hass, entry):
    return True
