"""Gracestack conversation entity — routes voice commands to OpenClaw/Frankenstein via Bridge."""
import logging
from typing import Literal

import aiohttp

from homeassistant.components.conversation import ConversationEntity, ConversationInput, ConversationResult
from homeassistant.core import HomeAssistant
from homeassistant.helpers import intent
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.typing import ConfigType, DiscoveryInfoType

from . import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_platform(
    hass: HomeAssistant,
    config: ConfigType,
    async_add_entities: AddEntitiesCallback,
    discovery_info: DiscoveryInfoType | None = None,
) -> None:
    """Set up the Gracestack conversation platform."""
    bridge_url = hass.data.get(DOMAIN, {}).get("bridge_url", "http://gracestack-bridge:3031")
    async_add_entities([GracestackConversationEntity(bridge_url)])


class GracestackConversationEntity(ConversationEntity):
    """Conversation entity that sends queries to Gracestack Bridge (OpenClaw/Frankenstein + Gemini)."""

    _attr_name = "Gracestack AI"
    _attr_unique_id = "gracestack_conversation"
    _attr_has_entity_name = True

    def __init__(self, bridge_url: str) -> None:
        """Initialize the entity."""
        self._bridge_url = bridge_url

    @property
    def supported_languages(self) -> Literal["*"]:
        """Return supported languages (all)."""
        return "*"

    async def async_process(self, user_input: ConversationInput) -> ConversationResult:
        """Process a sentence."""
        text = user_input.text
        language = user_input.language or "sv"

        _LOGGER.info("Gracestack processing: %s (lang=%s)", text, language)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self._bridge_url}/api/openclaw/chat",
                    json={
                        "message": text,
                        "channel": "homeassistant-voice",
                        "context": f"Home Assistant voice command (language: {language}). "
                                   f"The user is speaking to their smart home assistant. "
                                   f"Respond naturally and concisely in the same language as the user.",
                    },
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        reply = data.get("response", "Jag kunde inte svara just nu.")
                        source = data.get("source", "unknown")
                        _LOGGER.info("Gracestack reply (source=%s): %s", source, reply[:100])
                    else:
                        reply = "Gracestack AI är inte tillgänglig just nu."
                        _LOGGER.warning("Bridge returned %s", resp.status)

        except Exception as err:
            _LOGGER.error("Gracestack conversation error: %s", err)
            reply = "Jag kunde inte nå Gracestack AI. Försök igen."

        response = intent.IntentResponse(language=language)
        response.async_set_speech(reply)
        return ConversationResult(
            response=response,
            conversation_id=user_input.conversation_id,
        )
