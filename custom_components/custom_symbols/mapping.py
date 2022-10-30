"""Replacement Map handler"""

from __future__ import annotations
from homeassistant.config_entries import ConfigEntry

CONF_MAP = "replacement_map"

def mapping_parse(value: str) -> dict[str, str]:
    """Create dict from "mdi:ha > cs:ha" """
    return dict(
        (val.strip() for val in item.split('>'))
            for item in value.split(',')
        )

def mapping_get(entry:ConfigEntry) -> dict[str, str]:
    """Get map from options"""
    return entry.options.get(CONF_MAP, {})

def mapping_data(value: dict) -> dict[str, dict]:
    """Create data for options"""
    return {CONF_MAP: value}
