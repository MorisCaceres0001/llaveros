-- ============================================
-- SISTEMA DE LLAVEROS - BASE DE DATOS COMPLETA
-- Con datos de prueba incluidos
-- ============================================

DROP DATABASE IF EXISTS keychain_studio;
CREATE DATABASE keychain_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE keychain_studio;

-- ============================================
-- TABLA: admins
-- ============================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar admin por defecto
-- Usuario: admin | Password: admin123
INSERT INTO admins (username, password, email, full_name) VALUES 
('admin', '$2b$10$rqQr8LgH0CmLvjGXBYOqy.YlvY7kJX9KD4zp8BqXrLQ5L3QK4j7Cy', 'admin@keychain.com', 'Administrador Principal');

-- ============================================
-- TABLA: customers
-- ============================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    whatsapp VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_whatsapp (whatsapp),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    shape VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    is_custom BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shape (shape),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    order_status ENUM('pending', 'processing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_order_status (order_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: order_items
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_image VARCHAR(500) NOT NULL,
    shape VARCHAR(50) NOT NULL,
    background_color VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Clientes de prueba
INSERT INTO customers (name, email, whatsapp, address, city, postal_code) VALUES
('Juan Pérez', 'juan.perez@example.com', '50312345678', 'Calle Principal #123, Col. Centro', 'San Salvador', '1101'),
('María González', 'maria.gonzalez@example.com', '50387654321', 'Av. Los Próceres #456, Col. Escalón', 'San Salvador', '1102'),
('Carlos Ramírez', 'carlos.ramirez@example.com', '50398765432', 'Calle del Sol #789, Col. San Benito', 'Santa Tecla', '2201'),
('Ana Martínez', 'ana.martinez@example.com', '50376543210', 'Blvd. Constitución #321, Centro', 'San Miguel', '3301'),
('Luis Hernández', 'luis.hernandez@example.com', '50365432109', 'Calle Nueva #654, Col. Moderna', 'Santa Ana', '4401');

-- Productos de prueba (galería)
INSERT INTO products (image_url, shape, base_price, is_custom, is_active, views) VALUES
('/img/img1 (1).jpg', 'round', 2.50, TRUE, TRUE, 45),
('/img/img1 (3).jpg', 'square', 2.00, TRUE, TRUE, 32),
('/img/img1 (4).jpg', 'custom', 3.00, TRUE, TRUE, 28),
('/img/img1 (6).jpg', 'round', 2.50, TRUE, TRUE, 51),
('/img/img1 (7).jpg', 'square', 2.00, TRUE, TRUE, 38),
('/img/img1 (8).jpg', 'custom', 3.00, TRUE, TRUE, 42);

-- Pedidos de prueba
INSERT INTO orders (customer_id, order_number, total_amount, payment_status, order_status, payment_method, payment_id, created_at) VALUES
(1, 'ORD-1699000001-ABC123', 5.00, 'paid', 'delivered', 'stripe', 'pi_test_001', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 'ORD-1699000002-DEF456', 7.50, 'paid', 'delivered', 'stripe', 'pi_test_002', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 'ORD-1699000003-GHI789', 4.00, 'paid', 'processing', 'stripe', 'pi_test_003', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 'ORD-1699000004-JKL012', 9.00, 'paid', 'ready', 'stripe', 'pi_test_004', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 'ORD-1699000005-MNO345', 6.00, 'paid', 'delivered', 'stripe', 'pi_test_005', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'ORD-1699000006-PQR678', 8.00, 'paid', 'processing', 'stripe', 'pi_test_006', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'ORD-1699000007-STU901', 5.00, 'pending', 'pending', 'stripe', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'ORD-1699000008-VWX234', 12.00, 'paid', 'ready', 'stripe', 'pi_test_008', NOW());

-- Items de pedidos
INSERT INTO order_items (order_id, product_image, shape, background_color, quantity, unit_price, subtotal) VALUES
-- Pedido 1
(1, '/img/img1 (1).jpg', 'round', '#FFB6C1', 2, 2.50, 5.00),
-- Pedido 2
(2, '/img/img1 (3).jpg', 'square', '#E6E6FA', 3, 2.50, 7.50),
-- Pedido 3
(3, '/img/img1 (4).jpg', 'round', '#98FB98', 2, 2.00, 4.00),
-- Pedido 4
(4, '/img/img1 (6).jpg', 'custom', '#87CEEB', 3, 3.00, 9.00),
-- Pedido 5
(5, '/img/img1 (7).jpg', 'round', '#DDA0DD', 2, 3.00, 6.00),
-- Pedido 6
(6, '/img/img1 (8).jpg', 'square', '#F5DEB3', 4, 2.00, 8.00),
-- Pedido 7
(7, '/img/img1 (1).jpg', 'round', '#FFA07A', 2, 2.50, 5.00),
-- Pedido 8
(8, '/img/img1 (3).jpg', 'custom', '#20B2AA', 4, 3.00, 12.00);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Pedidos completos
CREATE VIEW v_orders_complete AS
SELECT 
    o.id,
    o.order_number,
    o.total_amount,
    o.payment_status,
    o.order_status,
    o.created_at,
    c.name as customer_name,
    c.email as customer_email,
    c.whatsapp as customer_whatsapp,
    c.city,
    COUNT(oi.id) as items_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Vista: Productos más vendidos
CREATE VIEW v_popular_products AS
SELECT 
    shape,
    COUNT(*) as total_orders,
    SUM(quantity) as total_quantity,
    SUM(subtotal) as total_revenue
FROM order_items
GROUP BY shape
ORDER BY total_orders DESC;

-- Vista: Estadísticas generales
CREATE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
    (SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'processing') as processing_orders,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered') as delivered_orders,
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as today_orders;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Base de datos creada exitosamente!' as status;
SELECT CONCAT('👤 Admins: ', COUNT(*)) as info FROM admins;
SELECT CONCAT('👥 Clientes: ', COUNT(*)) as info FROM customers;
SELECT CONCAT('📦 Productos: ', COUNT(*)) as info FROM products;
SELECT CONCAT('🛒 Pedidos: ', COUNT(*)) as info FROM orders;
SELECT CONCAT('💰 Ingresos totales: $', IFNULL(SUM(total_amount), 0)) as info FROM orders WHERE payment_status = 'paid';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================