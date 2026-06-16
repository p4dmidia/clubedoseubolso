-- Adicionar campos de data de nascimento e sexo nas tabelas user_profiles e affiliates
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(10);

ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20);
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS sex VARCHAR(10);
