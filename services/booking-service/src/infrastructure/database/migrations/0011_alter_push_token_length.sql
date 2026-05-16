-- Increase token column size to support FCM device tokens (much longer than Expo tokens)
ALTER TABLE push_token ALTER COLUMN expo_push_token TYPE VARCHAR(512);
