# Meter Admin Dashboard v7

Meters page actions now use the same UMEME endpoint:

- Edit meter:
  - POST https://fxapi.invict.site/api/umeme
  - payload: { api:100, code:104, data:{ meter_id, customer_name, address, phone_number, meter_type, meter_number } }

- Deactivate meter:
  - POST https://fxapi.invict.site/api/umeme
  - payload: { api:100, code:105, data:{ meter_id } }

Responses expected:
- {code:200, msg:"..."} success
- {code:300, msg:"..."} warning/error


Optimistic UI: Deactivate immediately marks the meter status as `deactivated` in the table, then refreshes in the background.


New meter actions:
- Clear Tamper (code 107) -> displays returned token
- Clear Credit (code 108) -> displays returned token

- Vending Token (code 109): prompts for amount and shows returned token in modal.
