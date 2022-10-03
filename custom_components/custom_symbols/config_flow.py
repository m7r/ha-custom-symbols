from homeassistant import config_entries
from shutil import copytree

@config_entries.HANDLERS.register("custom_symbols")
class CustomSymbolsConfigFlow(config_entries.ConfigFlow):
    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        try:
            copytree('custom_components/custom_symbols/data', 'custom_symbols')
        except:
            pass
        return self.async_create_entry(title="", data={})
