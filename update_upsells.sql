-- Create upsell_rules table
CREATE TABLE IF NOT EXISTS upsell_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    trigger_category_id BIGINT REFERENCES menu_categories(id) ON DELETE SET NULL,
    trigger_menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
    suggested_menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure at least one trigger is set
    CONSTRAINT check_trigger CHECK (trigger_category_id IS NOT NULL OR trigger_menu_item_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for upsell_rules" ON upsell_rules
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage upsell_rules" ON upsell_rules
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM restaurants WHERE id = upsell_rules.restaurant_id
    ));

-- Add Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE upsell_rules;
