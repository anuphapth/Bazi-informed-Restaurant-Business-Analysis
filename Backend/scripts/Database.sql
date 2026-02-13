BEGIN;

-- =========================================================
-- DROP TABLES (Respect FK Order)
-- =========================================================

DROP TABLE IF EXISTS token_blacklist CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS promotion_groups CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS user_elements CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- =========================================================
-- DROP TYPES
-- =========================================================

DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS coupon_status CASCADE;
DROP TYPE IF EXISTS menu_status CASCADE;
DROP TYPE IF EXISTS promotion_status CASCADE;
DROP TYPE IF EXISTS restaurant_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_gender CASCADE;
DROP TYPE IF EXISTS user_type_enum CASCADE;

-- =========================================================
-- CREATE ENUM TYPES
-- =========================================================

CREATE TYPE admin_role AS ENUM ('ADMIN', 'SUPER_ADMIN');
CREATE TYPE coupon_status AS ENUM ('UNUSED', 'USED', 'EXPIRED');
CREATE TYPE menu_status AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE promotion_status AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'EXPIRED');
CREATE TYPE restaurant_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE user_type_enum AS ENUM ('USER', 'RESTAURANT', 'ADMIN');

-- =========================================================
-- ADMINS
-- =========================================================

CREATE TABLE admins (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);

-- =========================================================
-- RESTAURANTS
-- =========================================================

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

CREATE INDEX idx_restaurants_email ON restaurants(email);
CREATE INDEX idx_restaurants_status ON restaurants(status);

-- =========================================================
-- USERS
-- =========================================================

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

CREATE INDEX idx_users_line_uid ON users(line_uid);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_status ON users(status);

-- =========================================================
-- USER ELEMENTS
-- =========================================================

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

-- =========================================================
-- MENU
-- =========================================================

CREATE TABLE menu (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  element JSONB NOT NULL,
  image_url VARCHAR(512),
  status menu_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_menu_restaurant ON menu(restaurant_id);
CREATE INDEX idx_menu_status ON menu(status);

-- =========================================================
-- PROMOTION GROUPS (MAIN PROMOTION DATA)
-- =========================================================

CREATE TABLE promotion_groups (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_value DECIMAL(5,2) NOT NULL CHECK (discount_value >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status promotion_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_date <= end_date),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_promotion_groups_restaurant ON promotion_groups(restaurant_id);
CREATE INDEX idx_promotion_groups_dates ON promotion_groups(start_date, end_date);
CREATE INDEX idx_promotion_groups_status ON promotion_groups(status);

-- =========================================================
-- PROMOTIONS (MENU MAPPING)
-- =========================================================

CREATE TABLE promotions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promotion_group_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (promotion_group_id, menu_id),
  FOREIGN KEY (promotion_group_id) REFERENCES promotion_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
);

CREATE INDEX idx_promotions_group ON promotions(promotion_group_id);
CREATE INDEX idx_promotions_menu ON promotions(menu_id);

-- =========================================================
-- COUPONS
-- =========================================================

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

CREATE INDEX idx_coupons_user ON coupons(user_id);
CREATE INDEX idx_coupons_promotion ON coupons(promotion_id);
CREATE INDEX idx_coupons_status ON coupons(status);

-- =========================================================
-- PREDICTIONS
-- =========================================================

CREATE TABLE predictions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL,
  prediction_date DATE NOT NULL,
  prediction_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_predictions_user_date ON predictions(user_id, prediction_date);

-- =========================================================
-- REFRESH TOKENS
-- =========================================================

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

-- =========================================================
-- TOKEN BLACKLIST
-- =========================================================

CREATE TABLE token_blacklist (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  user_type user_type_enum NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_elements_updated BEFORE UPDATE ON user_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_menu_updated BEFORE UPDATE ON menu FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_promotion_groups_updated BEFORE UPDATE ON promotion_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_promotions_updated BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_predictions_updated BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
