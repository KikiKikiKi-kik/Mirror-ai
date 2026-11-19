
export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    route: "moderate",
    message: "LootPay moderation API is online"
  });
}
