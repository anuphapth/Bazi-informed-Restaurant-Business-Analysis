import constants from "../lib/constants.js"
import db from "../lib/db.js"
import axios from "axios"
import crypto from "crypto"
import dotenv from "dotenv"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  trackLoginAttempt,
} from "../lib/jwt.js"
import {
  encodeShort,
  decodeShort,
} from "../utils/cryptoUtil.js";
dotenv.config()

const VALID_ELEMENTS = ["ดิน", "น้ำ", "ไฟ", "ทอง", "ไม้"]

export const lineUIDCheck = async (req, res) => {
  try {
    const { lineUid } = req.body;
    const token = req.query.t;

    const restaurantId = decodeShort(token);
    if (!restaurantId) {
      return res.status(401).json({ message: "Retaurant not found" });
    }

    const checkRestaurant = await db.query(
      constants.CheckRestarant,
      [restaurantId]
    );

    if (checkRestaurant.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const [checkUser] = await db.query(
      constants.CheckUser,
      [lineUid, restaurantId]
    );

    if (checkUser.length === 0) {
      return res.status(404).json({ action: "Register" });
    }

    const user = checkUser[0];

    const accessToken = generateAccessToken({
      userId: user.id,
      userType: "user",
      restaurantId: user.restaurant_id,
    });

    const refreshToken = await generateRefreshToken(user.id, "user", {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    });

    return res.status(200).json({
      action: "LOGIN",
      user: {
        id: user.id,
        line_uid: user.line_uid,
        name: user.name,
      },
      bazi: {
        main_element: user.main_element,
        favorable_elements: user.favorable_elements,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error("[lineUIDCheck Error]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const register = async (req, res) => {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    const token = req.query.t;

    const { lineUid, name, gender, phone, birth_date, birth_time, birth_place } = req.body
    const restaurantId = decodeShort(token);

    if (!restaurantId) {
      return res.status(401).json({ message: "Retaurant not found", });
    }

    const checkRestaurant = await connection.execute(constants.CheckRestarant, [restaurantId])
    if (checkRestaurant[0].length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: "Restaurant not found" })
    }

    const checkMember = await connection.execute(constants.CheckUser, [lineUid, restaurantId])
    if (checkMember[0].length > 0) {
      await connection.rollback()
      return res.status(409).json({ message: "User already registered" })
    }

    const [year, month, day] = birth_date.split("-").map(Number)
    const [hour, minute] = birth_time.split(":").map(Number)

    const createUserResult = await connection.execute(constants.createNewUser, [
      lineUid,
      restaurantId,
      name,
      gender,
      phone,
      birth_date,
      birth_time,
      birth_place,
    ])
    const userId = createUserResult[0].insertId

    let baziResponse
    try {
      baziResponse = await axios.post(
        "https://www.thailandfxwarrior.com/node/api/v1/bazi",
        {
          name: name,
          bday: day,
          bmonth: month,
          byear: year,
          b_hour: hour,
          b_minute: minute,
          bplace: birth_place,
          script: "zh",
          view: "full",
        },
        {
          timeout: 10000,
          headers: {
            "X-API-Key": process.env.BAZI_API_KEY,
          },
        },
      )
    } catch (apiError) {
      console.error("[Bazi API Error]", apiError.message)
      await connection.rollback()
      return res.status(503).json({ message: "Bazi service unavailable" })
    }

    if (!baziResponse?.data?.summary) {
      await connection.rollback()
      return res.status(502).json({ message: "Invalid Bazi response" })
    }

    const summary = baziResponse.data.summary
    const main_element = summary.dayMaster?.elementTh
    const favorable_elements = summary.favorableElements
    const unfavorable_elements = summary.unfavorableElements

    if (!main_element || !VALID_ELEMENTS.includes(main_element)) {
      await connection.rollback()
      return res.status(502).json({ message: "Invalid element data" })
    }

    await connection.execute(constants.insertElement, [
      userId,
      main_element,
      JSON.stringify(favorable_elements),
      JSON.stringify(unfavorable_elements),
    ])

    await connection.commit()

    const accessToken = generateAccessToken({
      userId: userId,
      userType: "user",
      restaurantId: restaurantId,
    })

    const refreshToken = await generateRefreshToken(userId, "user", {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    //await trackLoginAttempt(lineUid, "user", true, { ipAddress: req.ip })

    return res.status(201).json({
      action: "LOGIN",
      user: {
        id: userId,
        name,
        line_uid: lineUid,
      },
      bazi: {
        main_element,
        favorable_elements,
        unfavorable_elements,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    await connection.rollback()
    console.error("[Register Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const preEditProfile = async (req, res) => {
  try {
    const userID = req.user.id

    const [info] = await db.query(constants.preEditProfile, [userID])
    return res.status(200).json({ info })
  } catch (error) {
    console.error("[preEditProfile Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const editProfile = async (req, res) => {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const { name, gender, phone, birth_date, birth_time, birth_place } = req.body
    const userID = req.user.id

    const [users] = await connection.query(constants.CheckUserByID, [userID])

    const user = users[0]
    let main_element = user.main_element
    let baziResult = null

    await connection.query(constants.editProfile, [
      name ?? user.name,
      gender ?? user.gender,
      phone ?? user.phone,
      birth_date ?? user.birth_date,
      birth_time ?? user.birth_time,
      birth_place ?? user.birth_place,
      user.id,
    ])

    const birthChanged =
      birth_date !== undefined ||
      birth_time !== undefined ||
      birth_place !== undefined

    if (birthChanged) {
      const [year, month, day] = (birth_date ?? user.birth_date).split("-").map(Number)
      const [hour, minute] = (birth_time ?? user.birth_time).split(":").map(Number)

      const baziResponse = await axios.post(
        "https://www.thailandfxwarrior.com/node/api/v1/bazi",
        {
          name: name ?? user.name,
          bday: day,
          bmonth: month,
          byear: year,
          b_hour: hour,
          b_minute: minute,
          bplace: birth_place ?? user.birth_place,
          script: "zh",
          view: "full",
        },
        { headers: { "X-API-Key": process.env.BAZI_API_KEY } }
      )

      const summary = baziResponse.data.summary
      main_element = `${summary.dayMaster?.elementTh} ${summary.dayMaster?.polarity} ${summary.statusText}`
      const favorable_elements = summary.favorableElements
      const unfavorable_elements = summary.unfavorableElements

      await connection.query(constants.updateElementAfterEditProfile, [
        main_element,
        JSON.stringify(favorable_elements),
        JSON.stringify(unfavorable_elements),
        user.id,
      ])

      baziResult = { main_element, favorable_elements, unfavorable_elements }
    }

    await connection.commit()
    return res.status(200).json({ message: "Profile updated", bazi: baziResult })
  } catch (error) {
    await connection.rollback()
    console.error("[EditProfile Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const prediction = async (req, res) => {
  try {
    const userID = req.user.id
    const [checkUser] = await db.query(constants.checkUserAlready, [userID])
    if (checkUser.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const today = new Date().toISOString().slice(0, 10)

    const [existingPrediction] = await db.query(constants.checkPrediction, [userID, today])

    if (existingPrediction.length > 0) {
      return res.status(200).json({ message: existingPrediction[0].prediction_text })
    }

    const element = checkUser[0].main_element
    const favorable_elements = checkUser[0].favorable_elements
    const unfavorable_elements = checkUser[0].unfavorable_elements
    if (!element) {
      return res.status(400).json({ message: "Invalid user element data" })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return res.status(500).json({ message: "AI service not configured" })
    }

    const prompt = `
คุณเป็นนักเขียนคอลัมน์ดวงรายวันเชิงบันเทิง
ภาษาไทย สำนวนธรรมชาติ เหมือนคนเขียนจริง
เน้นการเล่าบรรยากาศและความรู้สึกของวัน
ไม่ใช้ภาษาระบบ ไม่อธิบายโหราศาสตร์ และไม่สรุปเชิงทฤษฎี

ข้อมูลประกอบ
พลังดวงพื้นฐาน ${element}
ธาตุที่ส่งเสริม ${favorable_elements}
ธาตุที่ควรเลี่ยง ${unfavorable_elements}
วันที่ ${today}

รูปแบบผลลัพธ์
- แสดงวันที่เป็นบรรทัดแรก
- เนื้อหาต่อจากนี้เขียนเป็น 3 ย่อหน้า
- แต่ละย่อหน้าไม่ยาวเกิน 1 บรรทัดบนหน้าจอ
- แยกย่อหน้าด้วยบรรทัดว่างชัดเจน
- ห้ามเขียนวันที่ซ้ำในเนื้อหา

แนวการเขียน
- ใช้ภาษาคน อ่านลื่น เหมือนคอลัมน์ที่อ่านทุกเช้า
- เขียนในมุมมองบุคคลที่สามหรือเชิงบรรยากาศ
- แต่ละย่อหน้าใช้ภาพหรืออารมณ์หลักเพียง 1 อย่าง
- เลี่ยงคำซ้ำและโครงประโยคซ้ำในย่อหน้าเดียว
- ใช้คำและภาพที่จับต้องได้ หลีกเลี่ยงอุปมาเชิงกวีลอย ๆ
- เขียนเหมือนบทความที่ไม่ได้พูดกับใครโดยตรง
- เลี่ยงการชี้ไปที่ผู้อ่าน
- คำว่า วันนี้ ใช้ได้เฉพาะย่อหน้าที่สามเท่านั้น

ระดับดวง
- ถ้าคะแนนมากกว่า 7 ถือว่าดวงดีมาก
- ถ้าคะแนน 4 ถึง 7 ถือว่าดวงปานกลาง
- ถ้าคะแนนต่ำกว่า 4 ถือว่าดวงแย่
- หากไม่มีคะแนน ให้ถือเป็นดวงปานกลาง
- เลือกเพียงระดับเดียวและใช้ให้สอดคล้องทั้ง 3 ย่อหน้า

ย่อหน้าที่ 1
- เล่าบรรยากาศหรือจังหวะของวัน
- ห้ามขึ้นต้นด้วยคำว่า วันนี้
- ใส่อีโมจิระดับดวงเพียงครั้งเดียวต่อท้าย
  🌟 ⚖️ 💀💀💀💀💀
- ห้ามใช้อีโมจิในย่อหน้าอื่น

ย่อหน้าที่ 2
- กล่าวถึงสีที่เหมาะกับวันนี้เพียง 1 สี
- สีต้องสอดคล้องกับธาตุที่ส่งเสริม
- เอ่ยชื่อสีได้เพียงครั้งเดียว
- หลังจากนั้นใช้คำแทน เช่น โทน บรรยากาศ หรือเฉด
- เขียนเชิงอารมณ์ ไม่อธิบายเหตุผล

ย่อหน้าที่ 3
- เขียนภาพรวมของวัน ครอบคลุมการใช้ชีวิต งาน เงิน
- กล่าวถึงของชิ้นเล็กที่พกแล้วช่วยให้วันผ่านไปได้ดี
- ใช้เพียงประโยคเดียวจบ
- น้ำเสียงต้องสอดคล้องกับระดับดวง
- สิ่งของต้องไม่ผิดกฎหมาย

ข้อห้ามสำคัญ
- ห้ามใช้สรรพนาม ฉัน เรา คุณ ผม ดิฉัน
- ห้ามใช้แฮชแท็กหรือภาษาสื่อสังคม
- ห้ามใช้ศัพท์โหราศาสตร์หรือคำสรุประบบ
- ห้ามอธิบายเหตุผลเชิงตรรกะ เช่น เพราะว่า จึงทำให้
- ห้ามใช้คำอวยเวอร์หรือทั่วไป เช่น ดีมาก สำเร็จมาก ทำได้ทุกอย่าง
`

    let response
    try {
      response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "คุณเป็นนักเขียนคอลัมน์ดวงรายวันภาษาไทย สำนวนธรรมชาติ เหมือนคนเขียนจริง ไม่ใช้สำนวนระบบหรือบันทึกส่วนตัว"
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 260,
          temperature: 0.85,
          frequency_penalty: 0.6,
          presence_penalty: 0.4,
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
        },
      )
    } catch (apiError) {
      console.error("[Groq API Error]", apiError.message)
      return res.status(503).json({ message: "Prediction service unavailable" })
    }

    const recommendation =
      response.data.choices?.[0]?.message?.content ||
      response.data.choices?.[0]?.text ||
      "ขอโทษ ไม่สามารถให้คำทำนายได้ในขณะนี้"

    const [predictionBefore] = await db.query(constants.checkPredictionBefor, [userID])

    if (predictionBefore.length > 0) {
      await db.query(constants.updatePrediction, [recommendation, today, userID])
    } else {
      await db.query(constants.insertPrediction, [userID, today, recommendation])
    }

    return res.status(200).json({ message: recommendation })
  } catch (error) {
    console.error("[Prediction Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const menu = async (req, res) => {
  try {
    const userID = req.user.id
    const { page } = req.body
    const limit = 12
    const offset = (page - 1) * limit

    const [menu] = await db.query(constants.getMenuByUser, [userID, limit, offset])
    const [rows] = await db.query(constants.getAllrowMenu, [userID])
    const lastPage = Math.ceil(rows[0].total / limit);
    return res.status(200).json({
      lastPage,
      menu
    })
  } catch (error) {
    console.error("[menu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const findMenu = async (req, res) => {
  try {
    const userID = req.user.id
    const restaurantId = req.user.restaurantId

    const { page } = req.body
    const limit = 12
    const offset = (page - 1) * limit
    const [menu] = await db.query(constants.findMenuElementLike, [userID, userID, limit, offset])
    const [rows] = await db.query(constants.getAllrowMenuElementLike, [restaurantId, userID])
    const lastPage = Math.ceil(rows[0].total / limit);
    return res.status(200).json({
      lastPage,
      menu: menu || []
    })
  } catch (error) {
    console.error("[FindMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const filterMenu = async (req, res) => {
  try {
    let { element, price = "asc", page = 1 } = req.body
    const restaurantId = req.user.restaurantId

    const limit = 12
    const offset = (page - 1) * limit

    if (!["asc", "desc"].includes(price)) {
      price = "asc"
    }

    let elementCondition = "";
    const params = [restaurantId];

    if (Array.isArray(element) && element.length > 0) {
      const conditions = element.map(el => `JSON_CONTAINS(m.element, ?)`);
      elementCondition = `AND (${conditions.join(" OR ")})`;
      element.forEach(el => {
        params.push(JSON.stringify([el]));
      });
    }

    elementCondition += " AND m.status = 'AVAILABLE'";

    const menuSql = constants.filterMenu
      .replace("/**element**/", elementCondition)
      .replace("/**price**/", price.toUpperCase());

    const [menu] = await db.query(menuSql, [
      ...params,
      limit,
      offset,
    ]);

    const countSql = constants.filterMenuCount.replace("/**element**/", elementCondition);
    const [rows] = await db.query(countSql, params);
    const lastPage = Math.ceil(rows[0].total / limit);

    return res.status(200).json({
      lastPage,
      menu,
    });
  } catch (error) {
    console.error("[filterMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createCoupon = async (req, res) => {
  try {
    const { promotion_id } = req.body
    const userID = req.user.id
    const [promotion] = await db.query(constants.checkPromotion, [promotion_id])

    if (promotion.length === 0) {
      return res.status(400).json({ message: "Promotion is not active or does not exist" })
    }

    const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase()
    const code = `PROMO-${randomBytes}`

    await db.query(constants.addCoupon, [userID, promotion_id, code])

    return res.status(201).json({ message: "Coupon created", code })
  } catch (error) {
    console.error("[CreateCoupon Error]", error)
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You have already claimed this promotion",
      })
    }
    return res.status(500).json({ message: "Server error" })
  }
}

export const useCoupon = async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.query("BEGIN")

    const { code } = req.body

    const [rows] = await connection.query(constants.checkCoupon, [code])

    if (rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(400).json({ message: "Invalid or expired coupon" })
    }

    const coupon = rows[0]

    if (coupon.status !== "UNUSED") {
      await connection.query("ROLLBACK")
      return res.status(400).json({ message: "Coupon already used" })
    }

    await connection.query(constants.useCoupon, [coupon.coupon_id])

    await connection.query("COMMIT")

    return res.status(200).json({
      message: "Coupon applied successfully",
      discount_value: coupon.discount_value,
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[UseCoupon Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
        code: "TOKEN_REQUIRED",
      })
    }

    const decoded = await verifyRefreshToken(refreshToken)

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      userType: decoded.userType,
      restaurantId: decoded.restaurantId,
    })

    return res.status(200).json({
      accessToken: newAccessToken,
    })
  } catch (error) {
    if (error.message === "Refresh token expired" || error.message === "Refresh token not found or expired") {
      return res.status(401).json({
        message: "Refresh token expired",
        code: "REFRESH_TOKEN_EXPIRED",
      })
    }

    return res.status(403).json({
      message: "Invalid refresh token",
      code: "REFRESH_TOKEN_INVALID",
    })
  }
}

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(" ")[1]

    if (accessToken) {
      await revokeAccessToken(accessToken, "user_logout")
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, "user_logout")
    }

    return res.status(200).json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[Logout Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    await revokeAllUserTokens(req.user.id, req.user.type)

    return res.status(200).json({
      message: "Logged out from all devices successfully",
    })
  } catch (error) {
    console.error("[LogoutAllDevices Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}
