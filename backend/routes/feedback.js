const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/feedback — submit feedback (requires logged-in user)
router.post("/", async (req, res) => {
    const { user_id, message } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
        return res.status(400).json({ error: "Invalid user_id format." });
    }

    if (!user_id || !message) {
        return res.status(400).json({ error: "user_id and message are required." });
    }

    const { error } = await supabase
        .from("feedback")
        .insert([{ user_id, message: message.trim() }]);

    if (error) {
        console.error("Feedback insert error:", error);
        return res.status(500).json({ error: "Failed to save feedback." });
    }

    res.status(201).json({ success: true, message: "Feedback submitted!" });
});

// GET /api/feedback/random — only show feedback from non-admin users
router.get("/random", async (req, res) => {
    const { data, error } = await supabase
        .from("feedback")
        .select(`
            id,
            message,
            created_at,
            users (
                id,
                username,
                role
            )
        `);

    if (error) {
        console.error("Feedback fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch feedback." });
    }

    const flat = data
        .filter(f => f.users && f.users.role !== 'admin') // ← only this line added
        .map(f => ({
            username: f.users.username,
            role: f.users.role || "User",
            message: f.message,
            created_at: f.created_at,
        }));

    const shuffled = flat.sort(() => Math.random() - 0.5).slice(0, 3);
    res.json(shuffled);
});

module.exports = router;