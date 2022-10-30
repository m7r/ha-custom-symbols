CONF_MAP = "replacement_map"

def mapping_parse(value):
    return dict(
        (val.strip() for val in item.split('>'))
            for item in value.split(',')
        )

def mapping_get(entry):
	  return entry.options.get(CONF_MAP, {})

def mapping_data(value):
	  return {CONF_MAP: value}
