"""Gracestack AI integration for Home Assistant — Frankenstein + OpenClaw conversation agent."""
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "gracestack"
CONF_BRIDGE_URL = "bridge_url"
DEFAULT_BRIDGE_URL = "http://gracestack-bridge:3031"
PLATFORMS = ["conversation"]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Gracestack from configuration.yaml."""
    hass.data.setdefault(DOMAIN, {})
    bridge_url = config.get(DOMAIN, {}).get(CONF_BRIDGE_URL, DEFAULT_BRIDGE_URL)
    hass.data[DOMAIN]["bridge_url"] = bridge_url
    _LOGGER.info("Gracestack AI integration loaded, bridge: %s", bridge_url)

    # Load conversation platform
    await hass.helpers.discovery.async_load_platform("conversation", DOMAIN, {}, config)

    return True
