"""Gracestack AI integration for Home Assistant — Frankenstein + OpenClaw conversation agent."""
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "gracestack"
DEFAULT_BRIDGE_URL = "http://gracestack-bridge:3031"
PLATFORMS = ["conversation"]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Gracestack from configuration.yaml."""
    conf = config.get(DOMAIN, {})
    bridge_url = conf.get("bridge_url", DEFAULT_BRIDGE_URL)
    hass.data[DOMAIN] = {"bridge_url": bridge_url}
    _LOGGER.info("Gracestack AI loaded, bridge=%s", bridge_url)

    # Use platform discovery
    from homeassistant.helpers.discovery import async_load_platform as alp
    hass.async_create_task(alp(hass, "conversation", DOMAIN, {}, config))
    return True
