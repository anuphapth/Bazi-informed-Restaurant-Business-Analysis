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
    SELECT id, name, price, element, description, image_url, status, created_at
    FROM menu
    WHERE restaurant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  addNewMenu: "INSERT INTO menu (restaurant_id, name, description, price, element, image_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",

  editMenu:
    "UPDATE menu SET name = COALESCE($1, name), price = COALESCE($2, price), element = COALESCE($3, element), image_url = COALESCE($4, image_url), status = COALESCE($5, status) ,description = COALESCE($6, description), updated_at = CURRENT_TIMESTAMP WHERE id = $7",

  deleteMenu: `
    DELETE FROM menu m WHERE m.id = $1
  `,
  getMenuByUser: `
SELECT 
  m.id,
  m.name,
  m.description,
  m.price,
  m.element,
  m.image_url,

  COALESCE(
    json_agg(
      DISTINCT jsonb_strip_nulls(
        jsonb_build_object(
          'promotion_id', ap.id,
          'name', ap.name,
          'description', ap.description,
          'end_date', ap.end_date,

          -- แสดงเป็น 100%
          'discount', ap.discount_value::text || '%',

          -- คำนวณราคารวมหลังลด
          'total',
            ROUND(
              m.price - (m.price * ap.discount_value / 100.0),
              2
            ),

          'coupon_code', ap.coupon_code
        )
      )
    ) FILTER (WHERE ap.id IS NOT NULL),
    '[]'
  ) AS promotions,

  CASE 
    WHEN COUNT(ap.id) > 0 THEN true
    ELSE false
  END AS "canUsePromotion"

FROM menu m

JOIN users u 
  ON m.restaurant_id = u.restaurant_id

LEFT JOIN (
    SELECT DISTINCT ON (pg.id, p.menu_id)

        p.id,
        p.menu_id,

        pg.name,
        pg.description,
        pg.discount_value,
        pg.end_date,

        c.code AS coupon_code

    FROM promotions p

    JOIN promotion_groups pg
        ON pg.id = p.promotion_group_id

    LEFT JOIN coupons c
        ON c.promotion_id = p.id
        AND c.user_id = $1
        AND c.status = 'UNUSED'

    WHERE pg.status = 'AVAILABLE'
      AND (NOW() AT TIME ZONE 'Asia/Bangkok')
          BETWEEN pg.start_date AND pg.end_date

      AND NOT EXISTS (
          SELECT 1
          FROM coupons cu
          WHERE cu.promotion_id = p.id
            AND cu.user_id = $1
            AND cu.status = 'USED'
      )

    ORDER BY pg.id, p.menu_id, p.id DESC

) ap ON ap.menu_id = m.id


WHERE u.id = $1
  AND m.status = 'AVAILABLE'

GROUP BY m.id

ORDER BY m.created_at DESC
LIMIT $2 OFFSET $3;
  `,

  getAllrowMenu: `
  SELECT COUNT(*) AS total FROM menu m 
  JOIN users u ON m.restaurant_id = u.restaurant_id
  WHERE u.id = $1 AND m.status = 'AVAILABLE'
  `,

  findMenuElementLike: `
SELECT 
  m.id,
  m.name,
  m.description,
  m.price,
  m.element,
  m.image_url,

  COALESCE(
    json_agg(
      DISTINCT jsonb_strip_nulls(
        jsonb_build_object(
          'promotion_id', ap.id,
          'name', ap.name,
          'description', ap.description,
          'end_date', ap.end_date,
          'discount', ap.discount_value::text || '%',
          'total',
            ROUND(
              m.price - (m.price * ap.discount_value / 100.0),
              2
            ),
          'coupon_code', ap.coupon_code
        )
      )
    ) FILTER (WHERE ap.id IS NOT NULL),
    '[]'
  ) AS promotions,

  CASE 
    WHEN COUNT(ap.id) > 0 THEN true
    ELSE false
  END AS "canUsePromotion"

FROM menu m

-- 🔥 promotion join
LEFT JOIN (
    SELECT DISTINCT ON (pg.id, p.menu_id)

        p.id,
        p.menu_id,

        pg.name,
        pg.description,
        pg.discount_value,
        pg.end_date,

        c.code AS coupon_code

    FROM promotions p

    JOIN promotion_groups pg
        ON pg.id = p.promotion_group_id

    LEFT JOIN coupons c
        ON c.promotion_id = p.id
        AND c.user_id = $2
        AND c.status = 'UNUSED'

    WHERE pg.status = 'AVAILABLE'

      AND (NOW() AT TIME ZONE 'Asia/Bangkok')
          BETWEEN pg.start_date AND pg.end_date

      -- ตัด USED ออก
      AND NOT EXISTS (
          SELECT 1
          FROM coupons cu
          WHERE cu.promotion_id = p.id
            AND cu.user_id = $2
            AND cu.status = 'USED'
      )

    ORDER BY pg.id, p.menu_id, p.id DESC

) ap ON ap.menu_id = m.id

WHERE m.restaurant_id = (
    SELECT restaurant_id FROM users WHERE id = $1
)

AND m.status = 'AVAILABLE'

-- 🔥 filter element like เดิม
AND EXISTS (
    SELECT 1
    FROM user_elements ue
    WHERE ue.user_id = $2
      AND m.element ?| (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(ue.favorable_elements)
      )
)

GROUP BY m.id

ORDER BY m.created_at DESC
LIMIT $3 OFFSET $4;
  `,

  filterMenu: `
SELECT 
  m.id,
  m.name,
  m.description,
  m.price,
  m.element,
  m.image_url,

  COALESCE(
    json_agg(
      DISTINCT jsonb_strip_nulls(
        jsonb_build_object(
          'promotion_id', ap.id,
          'name', ap.name,
          'description', ap.description,
          'end_date', ap.end_date,
          'discount', ap.discount_value::text || '%',
          'total',
            ROUND(
              m.price - (m.price * ap.discount_value / 100.0),
              2
            ),
          'coupon_code', ap.coupon_code
        )
      )
    ) FILTER (WHERE ap.id IS NOT NULL),
    '[]'
  ) AS promotions,

  CASE 
    WHEN COUNT(ap.id) > 0 THEN true
    ELSE false
  END AS "canUsePromotion"

FROM menu m

LEFT JOIN (
    SELECT DISTINCT ON (pg.id, p.menu_id)

        p.id,
        p.menu_id,

        pg.name,
        pg.description,
        pg.discount_value,
        pg.end_date,

        c.code AS coupon_code

    FROM promotions p

    JOIN promotion_groups pg
        ON pg.id = p.promotion_group_id

    LEFT JOIN coupons c
        ON c.promotion_id = p.id
        AND c.user_id = $2
        AND c.status = 'UNUSED'

    WHERE pg.status = 'AVAILABLE'
      AND (NOW() AT TIME ZONE 'Asia/Bangkok')
          BETWEEN pg.start_date AND pg.end_date

      AND NOT EXISTS (
          SELECT 1
          FROM coupons cu
          WHERE cu.promotion_id = p.id
            AND cu.user_id = $2
            AND cu.status = 'USED'
      )

    ORDER BY pg.id, p.menu_id, p.id DESC

) ap ON ap.menu_id = m.id

WHERE
  m.restaurant_id = $1
  AND m.status = 'AVAILABLE'
  AND (
        $3::text[] IS NULL
        OR m.element ?| $3::text[]
      )

GROUP BY m.id

ORDER BY m.price %%ORDER%%

LIMIT $4 OFFSET $5
`,

  filterMenuCount: `
SELECT COUNT(*)::int AS total
FROM menu m
WHERE
  m.restaurant_id = $1
  AND m.status = 'AVAILABLE'
  AND (
      $2::text[] IS NULL
      OR m.element ?| $2::text[]
    )
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
 SELECT p.id
FROM promotions p
JOIN promotion_groups pg
  ON pg.id = p.promotion_group_id
WHERE p.id = $1
  AND pg.status = 'AVAILABLE'
  AND CURRENT_DATE BETWEEN pg.start_date AND pg.end_date
LIMIT 1
`,

  checkUserCoupon: `
        SELECT id FROM coupons
     WHERE user_id = $1 AND promotion_id = $2
     LIMIT 1
`,


  getAllPromotionByRestaurant: `
SELECT
  pg.id AS promotion_group_id,
  pg.name,
  pg.description,
  pg.discount_value,
  pg.start_date,
  pg.end_date,
  pg.status,
  pg.created_at,
  pg.updated_at,
  m.id AS menu_id,
  m.name AS menu_name,
  m.price AS menu_price
FROM promotion_groups pg
LEFT JOIN promotions p
  ON pg.id = p.promotion_group_id
LEFT JOIN menu m
  ON p.menu_id = m.id
WHERE pg.restaurant_id = $1
ORDER BY pg.id, m.name;
  `,

  createGroupPromotion: `
  INSERT INTO promotion_groups
  (restaurant_id, name, description, discount_value, start_date, end_date, status)
  VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE')
  RETURNING id
`,
  createPromotionMapping: `
  INSERT INTO promotions (promotion_group_id, menu_id)
  VALUES ($1, $2)
`,

  getPromotionGroup: `
SELECT 
  pg.id AS promotion_group_id,
  pg.name,
  pg.description,
  pg.discount_value,
  pg.start_date,
  pg.end_date,
  pg.status,
  pg.created_at,
  pg.updated_at,
  m.id AS menu_id,
  m.name AS menu_name,
  m.price AS menu_price
FROM promotion_groups pg
LEFT JOIN promotions p
  ON pg.id = p.promotion_group_id
LEFT JOIN menu m
  ON p.menu_id = m.id
WHERE pg.id = $1
ORDER BY m.name;
`,

  updatePromotionGroup: `
UPDATE promotion_groups
SET name = COALESCE($1, name),
    description = COALESCE($2, description),
    discount_value = COALESCE($3, discount_value),
    start_date = COALESCE($4, start_date),
    end_date = COALESCE($5, end_date),
    status = COALESCE($6, status),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $7
RETURNING id;
`,

  deletePromotionGroup: `
DELETE FROM promotion_groups
WHERE id = $1
RETURNING id;
`,

  // Coupon queries
  addCoupon: `
    INSERT INTO coupons (user_id, promotion_id, code, status, created_at)
    VALUES ($1, $2, $3, 'UNUSED', CURRENT_TIMESTAMP)
  `,

  checkCoupon: `
  SELECT 
  c.id as coupon_id,
  c.status,
  c.code,
  pg.discount_value,
  pg.start_date,
  pg.end_date,
  pg.status as promotion_status
FROM coupons c
JOIN promotions p 
  ON c.promotion_id = p.id
JOIN promotion_groups pg 
  ON p.promotion_group_id = pg.id
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

  adminGetAllRestaurant: `
    SELECT
  r.id AS restaurant_id,
  r.name AS restaurant_name,
  json_agg(
    json_build_object(
      'userId', u.id,
      'name', u.name,
      'gender', u.gender,
      'phone', u.phone,
      'birth_date', u.birth_date,
      'birth_time', u.birth_time,
      'birth_place', u.birth_place,
      'status', u.status
    )
  ) FILTER (WHERE u.id IS NOT NULL) AS members
FROM restaurants r
LEFT JOIN users u ON u.restaurant_id = r.id
GROUP BY r.id, r.name
ORDER BY r.id;
  `,

  adminUpdateUser: `
  UPDATE users SET name = COALESCE($1, name), gender = COALESCE($2, gender), 
  phone = COALESCE($3, phone), birth_date = COALESCE($4, birth_date),
  birth_time = COALESCE($5, birth_time), birth_place = COALESCE($6, birth_place), 
  updated_at = CURRENT_TIMESTAMP 
  WHERE id = $7
  `,

  adminDeleteUser:`
  DELETE FROM users WHERE id = $1
  `,

  checkRestaurant:`
  SELECT * FROM restaurants WHERE id = $1
  `,

  deleteRestaurantByAdmin:`
  DELETE FROM restaurants WHERE id = $1
  `,
}

export default constants
