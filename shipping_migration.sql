-- Adicionar colunas de logística e frete à tabela de produtos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS length INTEGER DEFAULT 16,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 11,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS origin_zip TEXT DEFAULT '82820-160';

-- Adicionar colunas de frete à tabela de pedidos (orders)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Comentários para documentação
COMMENT ON COLUMN products.weight IS 'Peso do produto em kg';
COMMENT ON COLUMN products.length IS 'Comprimento do produto em cm';
COMMENT ON COLUMN products.width IS 'Largura do produto em cm';
COMMENT ON COLUMN products.height IS 'Altura do produto em cm';
COMMENT ON COLUMN products.origin_zip IS 'CEP de origem/saída do produto';
