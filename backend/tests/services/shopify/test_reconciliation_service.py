import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
import httpx
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.shopify.reconciliation_service import shopify_reconciliation_service
from app.models.integration import Integration

# --- Mocks ---

@pytest.fixture
def mock_session():
    return AsyncMock(spec=AsyncSession)

@pytest.fixture
def mock_integration():
    integration = MagicMock(spec=Integration)
    integration.id = "test-integration-id"
    integration.metadata_info = {"shop": "test-shop.myshopify.com"}
    return integration

@pytest.fixture
def mock_httpx_client():
    return AsyncMock(spec=httpx.AsyncClient)

# --- Tests ---

@pytest.mark.asyncio
async def test_fetch_remote_map_pagination(mock_httpx_client):
    """
    Test robust pagination logic:
    - Page 1 returns items 1, 2 and a Next Link
    - Page 2 returns item 3 and No Link
    """
    # Setup Responses
    resp1 = MagicMock()
    resp1.status_code = 200
    resp1.json.return_value = {
        "orders": [
            {"id": 1, "updated_at": "2024-01-01T10:00:00Z"},
            {"id": 2, "updated_at": "2024-01-01T11:00:00Z"}
        ]
    }
    # Simulate valid Link header
    resp1.headers = {"Link": '<https://test-shop.myshopify.com/admin/api/2024-01/orders.json?page_info=xyz>; rel="next"'}

    resp2 = MagicMock()
    resp2.status_code = 200
    resp2.json.return_value = {
        "orders": [
            {"id": 3, "updated_at": "2024-01-01T12:00:00Z"}
        ]
    }
    resp2.headers = {} # End of pages

    mock_httpx_client.get.side_effect = [resp1, resp2]

    # Execute
    remote_map = await shopify_reconciliation_service._fetch_remote_map(
        mock_httpx_client, "test-shop.myshopify.com", "token", "orders"
    )

    # Verify
    assert len(remote_map) == 3
    assert remote_map[1] == "2024-01-01T10:00:00Z"
    assert remote_map[3] == "2024-01-01T12:00:00Z"
    assert mock_httpx_client.get.call_count == 2


@pytest.mark.asyncio
async def test_parse_next_link():
    """Unit test for the regex parser helper"""
    # Standard Case
    header = '<https://shop.com/next>; rel="next"'
    assert shopify_reconciliation_service._parse_next_link(header) == "https://shop.com/next"

    # Multi-link Case
    header_multi = '<https://shop.com/prev>; rel="previous", <https://shop.com/next>; rel="next"'
    assert shopify_reconciliation_service._parse_next_link(header_multi) == "https://shop.com/next"

    # No Next Case
    header_prev_only = '<https://shop.com/prev>; rel="previous"'
    assert shopify_reconciliation_service._parse_next_link(header_prev_only) is None

    # None Case
    assert shopify_reconciliation_service._parse_next_link(None) is None


@pytest.mark.asyncio
async def test_diff_and_heal_missing(mock_session, mock_integration):
    """
    Test Case: Remote has ID 100, Local is empty.
    Should Trigger: _heal_batch([100])
    """
    remote_map = {100: "2024-01-01T10:00:00Z"}
    local_map = {}

    with patch.object(shopify_reconciliation_service, "_heal_batch", new_callable=AsyncMock) as mock_heal:
        await shopify_reconciliation_service._diff_and_heal(
            mock_session, mock_integration, "orders", remote_map, local_map
        )
        
        mock_heal.assert_called_once()
        args, _ = mock_heal.call_args
        # args[3] is ids list. Order is not guaranteed in set difference, so check if list contains 100
        assert 100 in args[3]


@pytest.mark.asyncio
async def test_diff_and_heal_zombie(mock_session, mock_integration):
    """
    Test Case: Local has ID 200, Remote is empty.
    Should Trigger: _delete_zombies([200])
    """
    remote_map = {}
    local_map = {200: datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)}

    with patch.object(shopify_reconciliation_service, "_delete_zombies", new_callable=AsyncMock) as mock_delete:
        await shopify_reconciliation_service._diff_and_heal(
            mock_session, mock_integration, "orders", remote_map, local_map
        )
        
        mock_delete.assert_called_once()
        args, _ = mock_delete.call_args
        assert 200 in args[3]


@pytest.mark.asyncio
async def test_diff_and_heal_stale(mock_session, mock_integration):
    """
    Test Case: ID 300 exists in both.
    Remote: 12:00
    Local: 10:00
    Should Trigger: _heal_batch([300]) (treated as 'dirty' requiring re-fetch)
    """
    remote_map = {300: "2024-01-01T12:00:00Z"}
    local_map = {300: datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)}

    with patch.object(shopify_reconciliation_service, "_heal_batch", new_callable=AsyncMock) as mock_heal:
        await shopify_reconciliation_service._diff_and_heal(
            mock_session, mock_integration, "orders", remote_map, local_map
        )
        
        mock_heal.assert_called_once()
        args, _ = mock_heal.call_args
        assert 300 in args[3]


@pytest.mark.asyncio
async def test_diff_and_heal_clean(mock_session, mock_integration):
    """
    Test Case: Perfect Match.
    Should Trigger: Nothing.
    """
    ts_str = "2024-01-01T12:00:00Z"
    ts_obj = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    
    remote_map = {400: ts_str}
    local_map = {400: ts_obj}

    with patch.object(shopify_reconciliation_service, "_heal_batch", new_callable=AsyncMock) as mock_heal:
        with patch.object(shopify_reconciliation_service, "_delete_zombies", new_callable=AsyncMock) as mock_delete:
            await shopify_reconciliation_service._diff_and_heal(
                mock_session, mock_integration, "orders", remote_map, local_map
            )
            
            mock_heal.assert_not_called()
            mock_delete.assert_not_called()
