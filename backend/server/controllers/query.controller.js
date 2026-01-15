



export const serverCheck = async (req, res) => {
    return res.status(200).json({ message: "Server is running" });
}