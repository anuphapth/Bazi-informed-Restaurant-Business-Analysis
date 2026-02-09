const constants = {
  // Restaurant queries
  CheckRestarant: "SELECT id, name, email FROM restaurants WHERE id = $1",
  restaurantLogin: "SELECT id, name, email, password FROM restaurants WHERE email = $1",
  editRestaurant:
    "UPDATE restaurants SET name = COALESCE($1, name), email = COALESCE($2, email), password = COALESCE($3, password), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP WHERE id = $5",

  getAllrowMenuByRestaurant: `
  SELECT COUNT(*) AS total FROM menu m 
  WHERE m.restaurant_id = $1 AND m.status = 'AVAILABLE'
  `,
  findMenuByRestaurant: `
    SELECT image_url FROM menu m 
    WHERE m.id = $1
  `,
  getAllrowUserByRestaurant: `
  SELECT COUNT(*) AS total
    FROM users u
    WHERE u.restaurant_id = $1
  `,
  // User queries
  CheckUser: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.line_uid = $1 AND u.restaurant_id = $2
  `,

  CheckUserByID: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = $1
  `,

  checkUserAlready: `
    SELECT u.id, u.name, u.restaurant_id, e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = $1
  `,

  createNewUser: `
    INSERT INTO users (line_uid, restaurant_id, name, gender, phone, birth_date, birth_time, birth_place, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING *;
  `,

  preEditProfile: `
    SELECT u.name, u.gender, u.phone, TO_CHAR(u.birth_date, 'YYYY-MM-DD') AS birth_date, u.birth_time, u.birth_place, ue.main_element
    FROM users u
    JOIN user_elements ue ON u.id = ue.user_id 
    WHERE u.id = $1
  `,
  editProfile:
    "UPDATE users SET name = COALESCE($1, name), gender = COALESCE($2, gender), phone = COALESCE($3, phone), birth_date = COALESCE($4, birth_date), birth_time = COALESCE($5, birth_time), birth_place = COALESCE($6, birth_place), updated_at = CURRENT_TIMESTAMP WHERE id = $7",

  findUser: `
    SELECT u.id, u.name, u.line_uid, u.phone, u.gender, u.created_at,
           e.main_element, e.favorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.restaurant_id = $1
    ORDER BY u.created_at DESC
    LIMIT $2 OFFSET $3
  `,

  // User elements queries
  insertElement: `
    INSERT INTO user_elements (user_id, main_element, favorable_elements, unfavorable_elements, created_at)
    VALUES ($1, $2, $3::jsonb, $4::jsonb, CURRENT_TIMESTAMP)
  `,

  updateElementAfterEditProfile: `
    UPDATE user_elements 
    SET main_element = $1, favorable_elements = $2, unfavorable_elements = $3, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $4
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
    WHERE user_id = $1 AND prediction_date = $2
    LIMIT 1
  `,

  checkPredictionBefor: `
    SELECT id
    FROM predictions
    WHERE user_id = $1
    LIMIT 1
  `,

  insertPrediction: `
    INSERT INTO predictions (user_id, prediction_date, prediction_text, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
  `,

  updatePrediction: `
    UPDATE predictions
    SET prediction_text = $1, prediction_date = $2, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $3
  `,

  // Menu queries
  getMenu: `
    SELECT id, name, price, element, image_url, status, created_at
    FROM menu
    WHERE restaurant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  addNewMenu: "INSERT INTO menu (restaurant_id, name, description, price, element, image_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",

  editMenu:
    "UPDATE menu SET name = COALESCE($1, name), price = COALESCE($2, price), element = COALESCE($3, element), image_url = COALESCE($4, image_url), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE id = $6",

  deleteMenu: `
    DELETE FROM menu m WHERE m.id = $1
  `,
  getMenuByUser: `
    SELECT m.id, m.name, m.price, m.element, m.image_url
    FROM menu m 
    JOIN users u ON m.restaurant_id = u.restaurant_id
    WHERE u.id = $1 AND m.status = 'AVAILABLE'
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `,

  getAllrowMenu: `
  SELECT COUNT(*) AS total FROM menu m 
  JOIN users u ON m.restaurant_id = u.restaurant_id
  WHERE u.id = $1 AND m.status = 'AVAILABLE'
  `,

  findMenuElementLike: `
SELECT m.id, m.name, m.price, m.element, m.image_url
FROM menu m
WHERE m.restaurant_id = (
    SELECT restaurant_id FROM users WHERE id = $1
)
AND m.status = 'AVAILABLE'
AND EXISTS (
    SELECT 1
    FROM user_elements ue
    WHERE ue.user_id = $2
      AND m.element ?| (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(ue.favorable_elements)
      )
)
ORDER BY m.created_at DESC
LIMIT $3 OFFSET $4;

  `,

  filterMenu: `
SELECT m.id, m.name, m.price, m.element, m.image_url
FROM menu m
WHERE m.restaurant_id = $1
  /**element**/
  AND m.status = 'AVAILABLE'
ORDER BY m.price /**price**/
LIMIT $3 OFFSET $4
    `,

  filterMenuCount: `
SELECT COUNT(*) AS total
FROM menu m
WHERE m.restaurant_id = $1
  /**element**/
  AND m.status = 'AVAILABLE'

    `,

  getAllrowMenuElementLike: `
SELECT COUNT(*) AS total
FROM menu m
WHERE m.restaurant_id = $1
  AND m.status = 'AVAILABLE'
  AND EXISTS (
      SELECT 1
      FROM user_elements ue
      WHERE ue.user_id = $2
        AND m.element ?| (
            SELECT array_agg(value)
            FROM jsonb_array_elements_text(ue.favorable_elements)
        )
  );
  `,

  findMenuelelemet: `
    SELECT id, name, price
    FROM menu
    WHERE element::jsonb @> $1::jsonb
      AND status = 'AVAILABLE'
  `,

  // Promotion queries
  checkPromotion: `
    SELECT id, discount_value, start_date, end_date
    FROM promotions
    WHERE id = $1
      AND status = 'AVAILABLE'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
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
WHERE m.restaurant_id = $1
ORDER BY p.promotion_group_id, p.created_at DESC;

  `,

  createGroupPromotion: `
    SELECT COALESCE(MAX(promotion_group_id), 0) + 1 as nextGroup
    FROM promotions
  `,

  createPromotion: `
    INSERT INTO promotions (promotion_group_id, menu_id, description, discount_value, start_date, end_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,

  getPromotionGroup: `
    SELECT 
      promotion_group_id,
      STRING_AGG(menu_id::text, ',') as menu_ids,
      description,
      discount_value,
      start_date,
      end_date,
      status,
      COUNT(*) as menu_count
    FROM promotions
    WHERE promotion_group_id = $1
    GROUP BY promotion_group_id, description, discount_value, start_date, end_date, status
  `,

  updatePromotionGroup: `
    UPDATE promotions
    SET start_date = COALESCE($1, start_date),
        end_date = COALESCE($2, end_date),
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE promotion_group_id = $4
  `,

  deletePromotionGroup: `
    DELETE FROM promotions
    WHERE promotion_group_id = $1
  `,

  // Coupon queries
  addCoupon: `
    INSERT INTO coupons (user_id, promotion_id, code, status, created_at)
    VALUES ($1, $2, $3, 'UNUSED', CURRENT_TIMESTAMP)
  `,

  checkCoupon: `
    SELECT c.id as coupon_id, c.status, c.code, p.discount_value, p.end_date as expires_at
    FROM coupons c
    INNER JOIN promotions p ON c.promotion_id = p.id
    WHERE c.code = $1
    LIMIT 1
  `,

  useCoupon: `
    UPDATE coupons
    SET status = 'USED', used_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `,

  adminLogin: `
    SELECT id, email, password, role FROM admins WHERE email = $1
  `,

  adminRegisRestaurant: `
    INSERT INTO restaurants (name, email, password, phone, address) VALUES ($1, $2, $3, $4, $5)
  `,
}

export default constants
