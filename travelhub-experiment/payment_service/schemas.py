from marshmallow import Schema, fields

class TransactionSchema(Schema):
    card_number = fields.Str(required=True)
    amount = fields.Float(required=True)
    merchant_id = fields.Str(required=True)
    ip_address = fields.Str(required=True)
