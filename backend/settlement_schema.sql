-- 1. Modify users table to add wallet_id
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wallet_id uuid UNIQUE;

-- Backfill existing users who don't have wallet_id yet
UPDATE public.users SET wallet_id = uuid_generate_v4() WHERE wallet_id IS NULL;

-- Make it NOT NULL going forward
ALTER TABLE public.users ALTER COLUMN wallet_id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN wallet_id SET DEFAULT uuid_generate_v4();

-- 2. Create settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Who is being paid
  payee_type varchar NOT NULL 
    CHECK (payee_type IN ('bus_owner', 'lounge_owner', 'driver', 'conductor')),
  payee_user_id uuid NOT NULL,                  -- FK → users.id
  
  -- What booking this earning comes from
  booking_id uuid,                               -- FK → bookings.id
  booking_reference varchar,                     -- Human-readable ref
  scheduled_trip_id uuid,                        -- For bus-related settlements
  lounge_booking_id uuid,                        -- For lounge-related settlements
  
  -- Money
  gross_amount numeric NOT NULL DEFAULT 0 
    CHECK (gross_amount >= 0),                   -- Share before commission
  commission_rate numeric NOT NULL DEFAULT 0,    -- e.g. 0.10 for 10%
  commission_amount numeric NOT NULL DEFAULT 0 
    CHECK (commission_amount >= 0),              -- Company keeps this
  net_amount numeric NOT NULL DEFAULT 0 
    CHECK (net_amount >= 0),                     -- Actual amount payee receives
  currency varchar DEFAULT 'LKR',
  
  -- Day-by-day tracking
  earning_date date NOT NULL DEFAULT CURRENT_DATE,  -- The day this earning was created
  
  -- Status progression: pending → accounted → paid
  status varchar NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accounted', 'paid', 'failed')),
  is_paid boolean NOT NULL DEFAULT false,        -- THE SUCCESS FLAG
  paid_at timestamp with time zone,              -- When it was actually paid
  settlement_batch_id uuid,                      -- Groups records paid together
  
  -- Metadata
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT settlements_pkey PRIMARY KEY (id),
  CONSTRAINT settlements_payee_fkey FOREIGN KEY (payee_user_id) REFERENCES public.users(id),
  CONSTRAINT settlements_booking_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Indexes for the midnight process
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status) WHERE status IN ('pending', 'accounted');
CREATE INDEX IF NOT EXISTS idx_settlements_payee_status ON public.settlements(payee_user_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_earning_date ON public.settlements(earning_date);

-- 3. Create payout_tracker table
CREATE TABLE IF NOT EXISTS public.payout_tracker (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  payee_user_id uuid NOT NULL,                   -- FK → users.id
  payee_type varchar NOT NULL 
    CHECK (payee_type IN ('bus_owner', 'lounge_owner', 'driver', 'conductor')),
  
  -- Cycle tracking
  payout_frequency_days integer NOT NULL DEFAULT 14,  -- 14 or 7
  last_payout_date date,                         -- Date of last successful payout (NULL = never paid)
  next_payout_date date,                         -- last_payout_date + frequency_days
  days_accumulated integer NOT NULL DEFAULT 0,   -- How many days since last payout
  
  -- Special request flag
  has_special_request boolean NOT NULL DEFAULT false,  -- True if owner requested 7-day cycle
  special_request_date timestamp with time zone,       -- When they requested it
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT payout_tracker_pkey PRIMARY KEY (id),
  CONSTRAINT payout_tracker_payee_fkey FOREIGN KEY (payee_user_id) REFERENCES public.users(id),
  CONSTRAINT payout_tracker_unique UNIQUE (payee_user_id, payee_type)
);

-- 4. Create settlement_batches table
CREATE TABLE IF NOT EXISTS public.settlement_batches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  payee_user_id uuid NOT NULL,
  payee_type varchar NOT NULL,
  
  -- Period covered
  period_start date NOT NULL,                    -- First day in this batch
  period_end date NOT NULL,                      -- Last day in this batch
  total_days integer NOT NULL,                   -- Number of days covered
  
  -- Aggregated totals
  total_settlements integer NOT NULL DEFAULT 0,
  total_gross_amount numeric NOT NULL DEFAULT 0,
  total_commission numeric NOT NULL DEFAULT 0,
  total_net_amount numeric NOT NULL DEFAULT 0,   -- THE FINAL AMOUNT PAID
  
  -- Linked wallet transaction
  wallet_transaction_id uuid,                    -- FK → wallet_transactions.id
  
  -- Status
  status varchar NOT NULL DEFAULT 'processing' 
    CHECK (status IN ('processing', 'completed', 'failed')),
  
  processed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT settlement_batches_pkey PRIMARY KEY (id),
  CONSTRAINT settlement_batches_payee_fkey FOREIGN KEY (payee_user_id) REFERENCES public.users(id)
);

-- 5. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  wallet_id uuid NOT NULL,                       -- From users.wallet_id
  
  amount numeric NOT NULL,                       -- Positive = credit, Negative = debit
  transaction_type varchar NOT NULL 
    CHECK (transaction_type IN ('credit', 'debit')),
  reference_type varchar NOT NULL 
    CHECK (reference_type IN ('settlement', 'withdrawal', 'adjustment', 'refund')),
  reference_id uuid,                             -- settlement_batch.id or withdrawal.id
  
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  
  description text,
  status varchar NOT NULL DEFAULT 'completed' 
    CHECK (status IN ('pending', 'completed', 'reversed')),
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON public.wallet_transactions(wallet_id, created_at DESC);

-- 6. Create settlement_config table
CREATE TABLE IF NOT EXISTS public.settlement_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  config_key varchar NOT NULL UNIQUE,            -- e.g. 'bus_owner_share_pct'
  config_value numeric NOT NULL,                 -- e.g. 80.00
  description text,
  
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT settlement_config_pkey PRIMARY KEY (id)
);

-- Default values for testing
INSERT INTO public.settlement_config (config_key, config_value, description) VALUES
  ('bus_owner_share_pct', 80.00, 'Bus owner share of bus fare (%)'),
  ('driver_share_pct', 12.00, 'Driver share of bus fare (%)'),
  ('conductor_share_pct', 8.00, 'Conductor share of bus fare (%)'),
  ('bus_owner_commission_pct', 10.00, 'Commission charged to bus owner (%)'),
  ('driver_commission_pct', 5.00, 'Commission charged to driver (%)'),
  ('conductor_commission_pct', 5.00, 'Commission charged to conductor (%)'),
  ('lounge_owner_share_pct', 90.00, 'Lounge owner share of lounge fare (%)'),
  ('lounge_owner_commission_pct', 10.00, 'Commission charged to lounge owner (%)'),
  ('default_payout_frequency_days', 14, 'Default payout cycle in days'),
  ('special_request_frequency_days', 7, 'Special request payout cycle in days')
ON CONFLICT (config_key) DO NOTHING;
