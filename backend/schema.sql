-- TABLE: permissions
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE: roles
CREATE TABLE roles (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE: role_permissions
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_id, permission_id)
);

-- TABLE: users
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    img VARCHAR(255),
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE: user_roles
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, role_id)
);

-- TABLE: categories
CREATE TABLE categories (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE: menu_items
CREATE TABLE menu_items (
    id BIGINT PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL, -- DECIMAL(12,2) tốt hơn cho tiền tệ
    rating DECIMAL(2, 1),
    tag VARCHAR(50),
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE: menu_item_images
CREATE TABLE menu_item_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE, -- Đánh dấu ảnh chính (thumbnail)
    display_order INT DEFAULT 0,       -- Thứ tự hiển thị (1, 2, 3...)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Khóa ngoại liên kết với bảng menu_items
    -- ON DELETE CASCADE: Nếu xóa món ăn, các ảnh liên quan cũng tự động bị xóa
    CONSTRAINT fk_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id)
        ON DELETE CASCADE
);

-- TABLE: orders
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    customer_id BIGINT REFERENCES users(id), -- Liên kết với Auth Users
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    table_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Received', 'Preparing', 'Cooking', 'Ready', 'Delivered')) DEFAULT 'Received',
    wait_level VARCHAR(10) CHECK (wait_level IN ('Low', 'Medium', 'High')),
    wait_time_minutes INTEGER,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 1. Thêm cột trạng thái thanh toán (nên dùng is_paid)
ALTER TABLE orders ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;

-- 2. Thêm phương thức thanh toán với ràng buộc để dữ liệu đồng nhất
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20)
    CHECK (payment_method IN ('Cash', 'Credit Card', 'E-Wallet', 'Bank Transfer'));

-- 3. Thêm thời điểm thanh toán (Rất quan trọng cho báo cáo doanh thu)
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP NULL;

ALTER TABLE orders ADD COLUMN total integer default NULL;

-- TABLE: order_items
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT REFERENCES menu_items(id),
    name_at_order VARCHAR(100) NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    price_at_order DECIMAL(12, 2) NOT NULL,
    modifications TEXT[],
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    updated TIMESTAMP NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_active ON users(id) WHERE deleted = FALSE AND active = TRUE;
CREATE INDEX idx_menu_items_active ON menu_items(category_id) WHERE deleted = FALSE;

INSERT INTO roles (name, description) VALUES
('ADMIN', 'Quản trị viên toàn hệ thống'),
('EMPLOYEE', 'Nhân viên cửa hàng'),
('CHEF', 'Nhân viên đầu bếp'),
('CUSTOMER', 'Khách hàng đặt món');
--
ALTER TABLE roles
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE users
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE categories
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE permissions
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE orders
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE order_items
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

ALTER TABLE menu_items
ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

--
-- Tạo function để tự động update cột 'updated'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ví dụ áp dụng cho bảng users và orders
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- (Bạn nên áp dụng tương tự cho tất cả các bảng còn lại)

SELECT setval(
  pg_get_serial_sequence('orders', 'id'),
  COALESCE((SELECT MAX(id) FROM orders), 0) + 1,
  false
);

-- Làm phần in hóa đơn thì làm như thế nào? Hãy triển Làm hiện thị lên ở Giao diện và cho download file hóa đơn đó nhé