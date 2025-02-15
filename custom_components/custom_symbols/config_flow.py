"""Config flow for Custom Symbols integration."""

from __future__ import annotations

import contextlib
from shutil import copytree
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import config_validation as cv

from .const import CONF_REPLACEMENT, CONF_REPLACEMENTS, DIR, DOMAIN
from .mapping import mapping_data, mapping_get, mapping_parse


class CustomSymbolsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Custom Symbols."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Create the options flow."""
        return OptionsFlowHandler(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Copy example at install and allow only one instance."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        with contextlib.suppress(IOError):
            copytree(DIR / "data", self.hass.config.path(DOMAIN))
        return self.async_create_entry(title="", data={})


class OptionsFlowHandler(OptionsFlow):
    """Handle a option flow."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle options flow."""
        errors = {}
        current_map = mapping_get(self.config_entry)
        label = {k: k + " > " + v for (k, v) in current_map.items()}

        if user_input is not None:
            replacements = user_input.get(CONF_REPLACEMENTS, [])
            updated_map = {k: v for (k, v) in current_map.items() if k in replacements}

            if user_input.get(CONF_REPLACEMENT):
                try:
                    updated_map = {
                        **updated_map,
                        **mapping_parse(user_input.get(CONF_REPLACEMENT)),
                    }
                except ValueError:
                    errors["base"] = "invalid_map_entry"

            if not errors:
                return self.async_create_entry(
                    title="",
                    data=mapping_data(updated_map),
                )

        options_schema = vol.Schema(
            {
                vol.Optional(CONF_REPLACEMENT): cv.string,
                vol.Optional(
                    CONF_REPLACEMENTS, default=list(label.keys())
                ): cv.multi_select(label),
            }
        )

        return self.async_show_form(
            step_id="init", data_schema=options_schema, errors=errors
        )
