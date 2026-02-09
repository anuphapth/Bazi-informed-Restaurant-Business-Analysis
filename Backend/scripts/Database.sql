-- PostgreSQL Database Schema for Bazi

-- Create ENUM types for PostgreSQL
CREATE TYPE admin_role AS ENUM ('ADMIN', 'SUPER_ADMIN');
CREATE TYPE coupon_status AS ENUM ('UNUSED', 'USED', 'EXPIRED');
CREATE TYPE menu_status AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE promotion_status AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'EXPIRED');
CREATE TYPE restaurant_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE user_type_enum AS ENUM ('USER', 'RESTAURANT', 'ADMIN');

--
-- Table structure for table admins
--

DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);

--
-- Table structure for table coupons
--

DROP TABLE IF EXISTS coupons;
CREATE TABLE coupons (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL,
  promotion_id INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  status coupon_status DEFAULT 'UNUSED',
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, promotion_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_coupons_promotion_id ON coupons(promotion_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);

--
-- Table structure for table menu
--

DROP TABLE IF EXISTS menu;
CREATE TABLE menu (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  element JSONB NOT NULL,
  image_url VARCHAR(512),
  status menu_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_menu_restaurant_id ON menu(restaurant_id);
CREATE INDEX idx_menu_status ON menu(status);

--
-- Table structure for table predictions
--

DROP TABLE IF EXISTS predictions;
CREATE TABLE predictions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL,
  prediction_date DATE NOT NULL,
  prediction_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_predictions_user_date ON predictions(user_id, prediction_date);

--
-- Table structure for table promotions
--

DROP TABLE IF EXISTS promotions;
CREATE TABLE promotions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promotion_group_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  description TEXT,
  discount_value DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status promotion_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_promotions_promotion_group ON promotions(promotion_group_id);
CREATE INDEX idx_promotions_menu_id ON promotions(menu_id);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_status ON promotions(status);

--
-- Table structure for table refresh_tokens
--

DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  user_type user_type_enum NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, user_type);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);

--
-- Table structure for table restaurants
--

DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  status restaurant_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_restaurants_email ON restaurants(email);
CREATE INDEX idx_restaurants_status ON restaurants(status);

--
-- Table structure for table token_blacklist
--

DROP TABLE IF EXISTS token_blacklist;
CREATE TABLE token_blacklist (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  user_type user_type_enum NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

--
-- Table structure for table user_elements
--

DROP TABLE IF EXISTS user_elements;
CREATE TABLE user_elements (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  main_element VARCHAR(50) NOT NULL,
  favorable_elements JSONB,
  unfavorable_elements JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_elements_main_element ON user_elements(main_element);

--
-- Table structure for table users
--

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  line_uid VARCHAR(255) NOT NULL,
  restaurant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  gender user_gender NOT NULL,
  phone VARCHAR(20),
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place VARCHAR(255) NOT NULL,
  status user_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (line_uid, restaurant_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_line_uid ON users(line_uid);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_status ON users(status);

--
-- Create triggers for automatic timestamp updates
--

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables that need updated_at tracking
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON menu FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_elements_updated_at BEFORE UPDATE ON user_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--
-- Insert sample data for testing
--

-- Insert sample admin
INSERT INTO admins (email, password, role) VALUES 
('admin@example.com', '$2b$10$samplehashedpassword', 'SUPER_ADMIN');

-- Insert sample restaurant
INSERT INTO restaurants (name, email, password, phone, address, status) VALUES 
('Sample Restaurant', 'restaurant@example.com', '$2b$10$samplehashedpassword', '123-456-7890', '123 Restaurant St, City', 'ACTIVE');

-- Insert sample user
INSERT INTO users (line_uid, restaurant_id, name, gender, phone, birth_date, birth_time, birth_place, status) VALUES 
('sample-line-uid-123', 1, 'Sample User', 'male', '098-765-4321', '1990-01-01', '12:00:00', 'Bangkok', 'ACTIVE');

-- Insert sample menu item
INSERT INTO menu (restaurant_id, name, description, price, element, image_url, status) VALUES 
(1, 'Sample Menu Item', 'A delicious sample menu item', 99.99, '{"main": "fire", "secondary": ["earth", "metal"]}', 'https://example.com/image.jpg', 'AVAILABLE');

-- Insert sample promotion
INSERT INTO promotions (promotion_group_id, menu_id, description, discount_value, start_date, end_date, status) VALUES 
(1, 1, 'Sample promotion for testing', 10.00, '2026-01-01', '2026-12-31', 'AVAILABLE');

-- Insert sample coupon
INSERT INTO coupons (user_id, promotion_id, code, status) VALUES 
(1, 1, 'SAMPLECODE123', 'UNUSED');

-- Insert sample prediction
INSERT INTO predictions (user_id, prediction_date, prediction_text) VALUES 
(1, '2026-02-05', 'Today is a good day for making important decisions.');

-- Insert sample user elements
INSERT INTO user_elements (user_id, main_element, favorable_elements, unfavorable_elements) VALUES 
(1, 'fire', '["wood", "earth"]', '["water", "metal"]');

--
-- End of PostgreSQL Database Schema for Bazi
--
