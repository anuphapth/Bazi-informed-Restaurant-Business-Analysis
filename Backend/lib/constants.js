const constants = {
  // Restaurant queries
  CheckRestarant: "SELECT id, name, email  FROM restaurants WHERE id = ?",
  restaurantLogin: "SELECT id, name, email, password FROM restaurants WHERE email = ?",
  editRestaurant:
    "UPDATE restaurants SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password), status = COALESCE(?, status),updated_at = CURRENT_TIMESTAMP WHERE id = ?",

  getAllrowMenuByRestaurant: `
  SELECT COUNT(*) AS total FROM menu m 
  WHERE m.restaurant_id = ? AND m.status = "AVAILABLE"
  `,
  findMenuByRestaurant: `
    SELECT image_url FROM menu m 
    WHERE m.id = ?
  `,
  getAllrowUserByRestaurant: `
  SELECT COUNT(*) AS total
    FROM users u
    WHERE u.restaurant_id = ?
  `,
  // User queries
  CheckUser: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.line_uid = ? AND u.restaurant_id = ?
  `,

  CheckUserByID: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = ?
  `,

  checkUserAlready: `
    SELECT u.id, u.name, u.restaurant_id, e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = ?
  `,

  createNewUser: `
    INSERT INTO users (line_uid, restaurant_id, name, gender, phone, birth_date, birth_time, birth_place, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,

  preEditProfile: `
    SELECT u.name ,u.gender ,u.phone ,DATE_FORMAT(u.birth_date, '%Y-%m-%d') AS birth_date ,u.birth_time ,u.birth_place, ue.main_element
    FROM users u
    JOIN user_elements ue ON u.id = ue.user_id 
    WHERE u.id = ?
  `,
  editProfile:
    "UPDATE users SET name = COALESCE(?, name), gender = COALESCE(?, gender), phone = COALESCE(?, phone), birth_date = COALESCE(?, birth_date), birth_time = COALESCE(?, birth_time), birth_place = COALESCE(?, birth_place), updated_at = CURRENT_TIMESTAMP WHERE id = ?",

  findUser: `
    SELECT u.id, u.name, u.line_uid, u.phone, u.gender, u.created_at,
           e.main_element, e.favorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.restaurant_id = ?
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `,

  // User elements queries
  insertElement: `
    INSERT INTO user_elements (user_id, main_element, favorable_elements, unfavorable_elements, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,

  updateElementAfterEditProfile: `
    UPDATE user_elements 
    SET main_element = ?, favorable_elements = ?, unfavorable_elements = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `,

  coolactElement: `
    SELECT main_element, COUNT(*) as count
    FROM user_elements
    GROUP BY main_element
    ORDER BY count DESC
  `,

  // Prediction queries
  checkPrediction: `
    SELECT prediction_text
    FROM predictions
    WHERE user_id = ? AND prediction_date = ?
    LIMIT 1
  `,

  checkPredictionBefor: `
    SELECT id
    FROM predictions
    WHERE user_id = ?
    LIMIT 1
  `,

  insertPrediction: `
    INSERT INTO predictions (user_id, prediction_date, prediction_text, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `,

  updatePrediction: `
    UPDATE predictions
    SET prediction_text = ?, prediction_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `,

  // Menu queries
  getMenu: `
    SELECT id, name, price, element, image_url, status, created_at
    FROM menu
    WHERE restaurant_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `,

  addNewMenu: "INSERT INTO menu (restaurant_id, name,description, price, element, image_url, status) VALUES (?, ?, ?, ?, ?, ?,?)",

  editMenu:
    "UPDATE menu SET name = COALESCE(?, name), price = COALESCE(?, price), element = COALESCE(?, element), image_url = COALESCE(?, image_url), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?",

  deleteMenu: `
    DELETE FROM menu m WHERE m.id = ?
  `,
  getMenuByUser: `
    SELECT m.id, m.name ,m.price ,m.element ,m.image_url
    FROM menu m 
    JOIN users u ON m.restaurant_id = u.restaurant_id
    WHERE u.id = ? AND m.status = "AVAILABLE"
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `,

  getAllrowMenu: `
  SELECT COUNT(*) AS total FROM menu m 
  JOIN users u ON m.restaurant_id = u.restaurant_id
  WHERE u.id = ? AND m.status = "AVAILABLE"
  `,

  findMenuElementLike: `
SELECT m.id, m.name, m.price, m.element , m.image_url
FROM menu m
WHERE m.restaurant_id = (
    SELECT restaurant_id FROM users WHERE id = ?
)
AND m.status = 'AVAILABLE'
AND EXISTS (
    SELECT 1
    FROM user_elements ue
    WHERE ue.user_id = ?
      AND JSON_OVERLAPS(m.element, ue.favorable_elements)
)
ORDER BY m.created_at DESC
LIMIT ? OFFSET ?
  `,

  filterMenu: `
SELECT m.id, m.name, m.price, m.element, m.image_url
FROM menu m
WHERE m.restaurant_id = ? /**element**/
  AND m.status = 'AVAILABLE'   -- กรองเฉพาะที่สถานะเป็น AVAILABLE
ORDER BY m.price /**price**/
LIMIT ? OFFSET ?

    `,

  filterMenuCount: `
    SELECT COUNT(*) AS total
FROM menu m
WHERE m.restaurant_id = ?
    `,

  getAllrowMenuElementLike: `
SELECT COUNT(*) AS total
FROM menu m
WHERE m.restaurant_id = ?
  AND m.status = 'AVAILABLE'
  AND EXISTS (
      SELECT 1
      FROM user_elements ue
      WHERE ue.user_id = ?
        AND JSON_OVERLAPS(m.element, ue.favorable_elements)
  )

  `,

  findMenuelelemet: `
    SELECT id, name, price
    FROM menu
    WHERE JSON_CONTAINS(element, ?)
      AND status = 'AVAILABLE'
  `,

  // Promotion queries
  checkPromotion: `
    SELECT id, discount_value, start_date, end_date
    FROM promotions
    WHERE id = ?
      AND status = 'AVAILABLE'
      AND start_date <= CURDATE()
      AND end_date >= CURDATE()
    LIMIT 1
  `,

  getAllPromotionByRestaurant: `
SELECT
  p.promotion_group_id,
  p.id               AS promotion_id,
  p.description,
  p.discount_value,
  p.start_date,
  p.end_date,
  p.status,
  p.created_at,
  p.updated_at
FROM promotions p
JOIN menu m
  ON p.menu_id = m.id
WHERE m.restaurant_id = ?
ORDER BY p.promotion_group_id, p.created_at DESC;

  `,

  createGroupPromotion: `
    SELECT COALESCE(MAX(promotion_group_id), 0) + 1 as nextGroup
    FROM promotions
  `,

  createPromotion: `
    INSERT INTO promotions (promotion_group_id, menu_id, description, discount_value, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  getPromotionGroup: `
    SELECT 
      promotion_group_id,
      GROUP_CONCAT(menu_id) as menu_ids,
      description,
      discount_value,
      start_date,
      end_date,
      status,
      COUNT(*) as menu_count
    FROM promotions
    WHERE promotion_group_id = ?
    GROUP BY promotion_group_id, description, discount_value, start_date, end_date, status
  `,

  updatePromotionGroup: `
    UPDATE promotions
    SET start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE promotion_group_id = ?
  `,

  deletePromotionGroup: `
    DELETE FROM promotions
    WHERE promotion_group_id = ?
  `,

  // Coupon queries
  addCoupon: `
    INSERT INTO coupons (user_id, promotion_id, code, status, created_at)
    VALUES (?, ?, ?, 'UNUSED', CURRENT_TIMESTAMP)
  `,

  checkCoupon: `
    SELECT c.id as coupon_id, c.status, c.code, p.discount_value, p.end_date as expires_at
    FROM coupons c
    INNER JOIN promotions p ON c.promotion_id = p.id
    WHERE c.code = ?
    LIMIT 1
  `,

  useCoupon: `
    UPDATE coupons
    SET status = 'USED', used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  adminLogin: `
    SELECT id, email, password, role FROM admins WHERE email = ?
  `,

  adminRegisRestaurant: `
    INSERT INTO restaurants (name, email, password, phone, address)VALUES (?, ?, ?, ?, ?)
  `,
}

export default constants
