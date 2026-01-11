from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance
# using remote address as key (IP based)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
