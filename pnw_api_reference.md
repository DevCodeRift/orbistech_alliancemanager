# Politics and War GraphQL API v3 Reference

## Overview

Politics and War's GraphQL API v3 provides comprehensive access to game data through a single endpoint. Unlike traditional REST APIs, GraphQL allows you to request exactly the data you need in a single query, making it highly efficient for complex data retrieval.

**What is GraphQL?**
GraphQL is a query language that allows computers to write a query (what they want from the API) and receive exactly that data. The whole query is surrounded by curly braces `{}`, starts with the word `query` (optional for queries), and uses sub-selections to specify exactly which fields you want.

Example basic query:
```graphql
query {
    nations(id: 6) {
        data {
            id
            nation_name 
            cities {
                id
            }
        }
    }
}
```

## Base Information

- **Main Server URL**: `https://api.politicsandwar.com/graphql`
- **Test Server URL**: `https://api-test.politicsandwar.com/graphql`
- **GraphQL Playground**: `https://api.politicsandwar.com/graphql-playground`
- **Authentication**: API key required for all requests (append `?api_key=YOUR_API_KEY_HERE`)
- **API Key Location**: Found at https://politicsandwar.com/account/#7
- **Rate Limits**: 
  - Standard: 2,000 requests/day
  - VIP: 15,000 requests/day

**Important**: Always append `?api_key=xxxxxx` to the request URL in the playground, or you'll see server/authentication errors.

## Making API Requests

### HTTP POST Method
All API requests are HTTP POST requests to the GraphQL endpoint with:
- **Content-Type**: `application/json`
- **Body**: JSON with `{"query": "YOUR_GRAPHQL_QUERY_HERE"}`

### Python Examples

**Using requests library:**
```python
import requests

data = requests.post(
    "https://api.politicsandwar.com/graphql?api_key=YOUR_API_KEY_HERE",
    json={"query": """
        query {
            nations(id: 6) {
                data {
                    id
                    nation_name 
                    cities {
                        id
                    }
                }
            }
        }"""
    }
)
```

**Using aiohttp (async):**
```python
import aiohttp
import asyncio

async def main():
    async with aiohttp.request(
        "POST",
        "https://api.politicsandwar.com/graphql?api_key=YOUR_API_KEY_HERE",
        json={"query": """
            query {
                nations(id: 6) {
                    data {
                        id
                        nation_name 
                        cities {
                            id
                        }
                    }
                }
            }"""
        }
    ) as response:
        data = await response.json()

asyncio.run(main())
```

**Using pnwkit-py (recommended):**
```python
import pnwkit

kit = pnwkit.QueryKit("YOUR_API_KEY_HERE")
query = kit.query("nations", {"id": 6}, "id nation_name cities{id}")
data = query.get() # or await query for async
```

### JavaScript Examples

**Using fetch:**
```javascript
const data = await (await fetch(`https://api.politicsandwar.com/graphql?api_key=YOUR_API_KEY_HERE`, {
    method: 'POST',
    headers: new Headers({"Content-Type": "application/json"}),
    body: JSON.stringify({query: `
            query {
                nations(id: 6) {
                    data {
                        id
                        nation_name 
                        cities {
                            id
                        }
                    }
                }
            }`
    }),
})).text();
```

**Using PnWKit (recommended):**
```javascript
import pnwkit from "pnwkit";
pnwkit.setKey("YOUR_API_KEY_HERE");

const data = await pnwkit.nationQuery({id: [6]}, `id nation_name cities{id}`);
```

## Pagination

Since the game has massive amounts of data, the API limits how much it returns per query. Use pagination to get all data across multiple requests.

**Pagination Parameters:**
- `first` - Number of records to return (limit)
- `page` - Which page to retrieve

**Pagination Info:**
```graphql
query {
    nations(alliance_id: 790, first: 50, page: 1) {
        data {
            id
            nation_name 
        }
        paginatorInfo {
            currentPage
            hasMorePages
            lastPage
            total
            count
        }
    }
}
```

Use `hasMorePages` and `lastPage` to determine if you need additional queries.

## Complete Query Operations Reference

### All Available Queries

**Core Game Data:**
- `me` - Your API key details and permissions
- `treasures` - All treasures in the game
- `colors` - Color bloc information and turn bonuses
- `game_info` - Current game date, radiation levels, city averages
- `top_trade_info` - Market index and current best buy/sell offers

**Nation & Alliance Queries:**
- `nations` - Nation data with 35+ filtering parameters
- `alliances` - Alliance information with filtering
- `cities` - City-specific data and infrastructure
- `banned_nations` - Information about banned players

**Economic & Trade:**
- `tradeprices` - Historical average prices for all resources
- `trades` - Trade history with extensive filtering
- `bankrecs` - Banking transactions and transfers
- `treasure_trades` - Treasure buying/selling offers
- `embargoes` - Trade embargoes between nations/alliances

**Military & Conflict:**
- `wars` - War data with comprehensive filtering
- `warattacks` - Individual attack records with detailed casualties
- `bounties` - Active bounties with amounts and types

**Diplomacy:**
- `treaties` - Alliance treaties and agreements

**Communication:**
- `bulletins` - Alliance and nation announcements
- `bulletin_replies` - Replies to bulletins

**Statistics:**
- `nation_resource_stats` - Per-nation resource averages over time
- `resource_stats` - Global resource statistics over time
- `activity_stats` - Player activity metrics over time

**Baseball (Sports):**
- `baseball_games` - Game results and statistics
- `baseball_teams` - Team information and performance  
- `baseball_players` - Individual player stats

### Query Parameters by Endpoint

**nations Parameters:**
```graphql
nations(
  id: [Int]                    # Specific nation IDs
  min_id: [Int]               # Minimum nation ID
  max_id: [Int]               # Maximum nation ID
  nation_name: [String]       # Nation name matching
  leader_name: [String]       # Leader name matching
  alliance_id: [Int]          # Alliance ID filtering
  alliance_position: [Int]    # Alliance position filtering
  alliance_position_id: [Int] # Alliance position ID filtering
  color: [String]             # Color bloc filtering
  created_before: DateTime    # Founded before date
  created_after: DateTime     # Founded after date
  active_since: DateTime      # Active since date
  active_before: DateTime     # Active before date
  min_score: Float           # Minimum score
  max_score: Float           # Maximum score
  cities: [Int]              # Exact city count
  min_cities: Int            # Minimum cities
  max_cities: Int            # Maximum cities
  vmode: Boolean             # Vacation mode status
  discord: [String]          # Discord username
  discord_id: [String]       # Discord ID
  tax_id: [Int]             # Tax bracket ID
  continent: [Continents]    # Continent filtering
  orderBy: [QueryNationsOrderByOrderByClause!]
  first: Int = 50           # Limit (max 500)
  page: Int                 # Page number
)
```

**alliances Parameters:**
```graphql
alliances(
  id: [Int]                   # Alliance IDs
  name: [String]              # Alliance name matching
  color: [String]             # Color bloc filtering
  orderBy: [QueryAlliancesOrderByOrderByClause!]
  first: Int = 10            # Limit (max 500)
  page: Int                  # Page number
)
```

**wars Parameters:**
```graphql
wars(
  id: [Int]                   # War IDs
  min_id: Int                # Minimum war ID
  max_id: Int                # Maximum war ID
  before: DateTime           # Started before date
  after: DateTime            # Started after date
  ended_before: DateTime     # Ended before date
  ended_after: DateTime      # Ended after date
  attid: [Int]              # Attacker nation IDs
  defid: [Int]              # Defender nation IDs
  or_id: [Int]              # Either attacker or defender IDs
  days_ago: Int             # Wars from X days ago
  active: Boolean = true    # Active wars only
  status: WarActivity = ALL # War status filter
  nation_id: [Int]          # Participant nation IDs
  alliance_id: [Int]        # Participant alliance IDs
  orderBy: [QueryWarsOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```

**trades Parameters:**
```graphql
trades(
  id: [Int]                    # Trade IDs
  min_id: Int                 # Minimum trade ID
  max_id: Int                 # Maximum trade ID
  before: DateTime            # Posted before date
  after: DateTime             # Posted after date
  type: TradeType            # Trade type (GLOBAL/PERSONAL/ALLIANCE)
  nation_id: [Int]           # Nation IDs involved
  offer_resource: [String]   # Resource being traded
  buy_or_sell: String        # "buy" or "sell"
  accepted: Boolean          # Accepted status
  original_trade_id: [Int]   # Original trade IDs
  orderBy: [QueryTradesOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```

**bankrecs Parameters:**
```graphql
bankrecs(
  id: [Int]                   # Bank record IDs
  min_id: Int                # Minimum record ID
  max_id: Int                # Maximum record ID
  before: DateTime           # Occurred before date
  after: DateTime            # Occurred after date
  stype: [Int]              # Sender type (1=nation, 2=alliance)
  rtype: [Int]              # Receiver type (1=nation, 2=alliance)
  or_type: [Int]            # Sender OR receiver type
  sid: [Int]                # Sender IDs
  rid: [Int]                # Receiver IDs
  or_id: [Int]              # Sender OR receiver IDs
  orderBy: [QueryBankrecsOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```

**warattacks Parameters:**
```graphql
warattacks(
  id: [Int]                   # Attack IDs
  min_id: Int                # Minimum attack ID
  max_id: Int                # Maximum attack ID
  war_id: [Int]              # War IDs
  before: DateTime           # Occurred before date
  after: DateTime            # Occurred after date
  orderBy: [QueryWarattacksOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```

**cities Parameters:**
```graphql
cities(
  id: [Int]                   # City IDs
  nation_id: [Int]           # Nation IDs
  orderBy: [QueryCitiesOrderByOrderByClause!]
  first: Int = 50           # Limit (max 500)
  page: Int                 # Page number
)
```

**bounties Parameters:**
```graphql
bounties(
  nation_id: [Int]           # Target nation IDs
  min_amount: Float          # Minimum bounty amount
  max_amount: Float          # Maximum bounty amount
  orderBy: [QueryBountiesOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```

**treaties Parameters:**
```graphql
treaties(
  id: [Int]                  # Treaty IDs
  orderBy: [QueryTreatiesOrderByOrderByClause!]
  first: Int = 50           # Limit (max 1000)
  page: Int                 # Page number
)
```
Query nation data with extensive filtering capabilities.

**Parameters:**
- `id`, `min_id`, `max_id` - Nation ID filtering
- `nation_name`, `leader_name` - String matching
- `alliance_id`, `alliance_position`, `alliance_position_id` - Alliance filtering
- `color` - Color bloc filtering
- `created_before`, `created_after`, `active_since`, `active_before` - Date filtering
- `min_score`, `max_score` - Score range
- `cities`, `min_cities`, `max_cities` - City count filtering
- `vmode` - Vacation mode status
- `discord`, `discord_id` - Discord information
- `tax_id` - Tax bracket filtering
- `continent` - Continent filtering
- `orderBy` - Sorting options
- `first` - Limit (max 500)
- `page` - Pagination

**Complete Nation Fields:**
```graphql
{
  nations(first: 10) {
    data {
      # Basic Information
      id
      nation_name
      leader_name
      alliance_id
      alliance_position
      alliance_position_id
      alliance_position_info {
        id
        name
        position_level
        permissions
      }
      alliance {
        name
        acronym
        id
      }
      continent
      color
      num_cities
      score
      population
      flag
      date
      last_active
      
      # Military Units
      soldiers
      tanks
      aircraft
      ships
      missiles
      nukes
      spies
      soldiers_today
      tanks_today
      aircraft_today
      ships_today
      missiles_today
      nukes_today
      spies_today
      
      # Resources (visible based on permissions)
      money
      coal
      oil
      uranium
      iron
      bauxite
      lead
      gasoline
      munitions
      steel
      aluminum
      food
      credits
      
      # Policies & Settings
      war_policy
      war_policy_turns
      domestic_policy
      domestic_policy_turns
      economic_policy
      social_policy
      government_type
      update_tz
      
      # Status & Modes
      vacation_mode_turns
      beige_turns
      espionage_available
      vip
      
      # All 39 Projects
      projects
      project_bits
      iron_works
      bauxite_works
      arms_stockpile
      emergency_gasoline_reserve
      mass_irrigation
      international_trade_center
      missile_launch_pad
      nuclear_research_facility
      iron_dome
      vital_defense_system
      central_intelligence_agency
      center_for_civil_engineering
      propaganda_bureau
      uranium_enrichment_program
      urban_planning
      advanced_urban_planning
      space_program
      spy_satellite
      moon_landing
      pirate_economy
      recycling_initiative
      telecommunications_satellite
      green_technologies
      arable_land_agency
      clinical_research_center
      specialized_police_training_program
      advanced_engineering_corps
      government_support_agency
      research_and_development_center
      activity_center
      metropolitan_planning
      military_salvage
      fallout_shelter
      bureau_of_domestic_affairs
      advanced_pirate_economy
      mars_landing
      surveillance_network
      guiding_satellite
      nuclear_launch_facility
      military_research_center
      military_doctrine
      
      # Project Dates
      moon_landing_date
      mars_landing_date
      
      # Statistics
      wars_won
      wars_lost
      soldier_casualties
      soldier_kills
      tank_casualties
      tank_kills
      aircraft_casualties
      aircraft_kills
      ship_casualties
      ship_kills
      missile_casualties
      missile_kills
      nuke_casualties
      nuke_kills
      spy_casualties
      spy_kills
      spy_attacks
      money_looted
      total_infrastructure_destroyed
      total_infrastructure_lost
      offensive_wars_count
      defensive_wars_count
      
      # Economic Data
      gross_national_income
      gross_domestic_product
      tax_id
      alliance_seniority
      alliance_join_date
      credits_redeemed_this_month
      cities_discount
      
      # Activity & Timing
      turns_since_last_city
      turns_since_last_project
      
      # Misc
      discord
      discord_id
      commendations
      denouncements
      
      # Nested Relations
      cities {
        id
        name
        date
        infrastructure
        land
        powered
        # Power plants
        oil_power
        wind_power
        coal_power
        nuclear_power
        # Resource buildings
        coal_mine
        oil_well
        uranium_mine
        lead_mine
        iron_mine
        bauxite_mine
        oil_refinery
        aluminum_refinery
        steel_mill
        munitions_factory
        # Other buildings
        barracks
        farm
        police_station
        hospital
        recycling_center
        subway
        supermarket
        bank
        shopping_mall
        stadium
        factory
        hangar
        drydock
        nuke_date
      }
      
      treasures {
        name
        color
        continent
        bonus
        spawn_date
      }
      
      baseball_team {
        id
        name
        logo
        quality
        seating
        rating
        wins
        glosses
      }
      
      awards {
        name
        image
      }
      
      military_research {
        ground_capacity
        ground_cost
        air_capacity
        air_cost
        naval_capacity
        naval_cost
      }
    }
  }
}
```

### Alliances
Query alliance data and member information.

**Parameters:**
- `id`, `name`, `color` - Basic filtering
- `orderBy` - Sorting
- `first` - Limit (max 500)
- `page` - Pagination

**Complete Alliance Fields:**
```graphql
{
  alliances(first: 10) {
    data {
      # Basic Information
      id
      name
      acronym
      score
      color
      date
      rank
      average_score
      accept_members
      flag
      forum_link
      discord_link
      wiki_link
      
      # Bank Resources (if authorized)
      money
      coal
      oil
      uranium
      iron
      bauxite
      lead
      gasoline
      munitions
      steel
      aluminum
      food
      
      # Nested Relations
      nations {
        id
        nation_name
        leader_name
        score
        num_cities
        alliance_position
        last_active
      }
      
      alliance_positions {
        id
        name
        position_level
        leader
        heir
        officer
        member
        permissions
        view_bank
        withdraw_bank
        change_permissions
        see_spies
        see_reset_timers
        tax_brackets
        post_announcements
        manage_announcements
        accept_applicants
        remove_members
        edit_alliance_info
        manage_treaties
        manage_market_share
        manage_embargoes
        promote_self_to_leader
        date
        creator_id
        last_editor_id
        date_modified
      }
      
      treaties {
        id
        date
        treaty_type
        treaty_url
        turns_left
        alliance1_id
        alliance2_id
        alliance1 { name }
        alliance2 { name }
        approved
      }
      
      tax_brackets {
        id
        bracket_name
        tax_rate
        resource_tax_rate
        date
        date_modified
        last_modifier_id
      }
      
      awards {
        name
        image
      }
    }
  }
}
```

### Wars
Query war data with comprehensive filtering.

**Parameters:**
- `id`, `min_id`, `max_id` - War ID filtering
- `before`, `after`, `ended_before`, `ended_after` - Date filtering
- `attid`, `defid`, `or_id` - Participant filtering
- `days_ago` - Recent wars
- `active` - Active status (default: true)
- `status` - War activity (ALL, ACTIVE, INACTIVE)
- `nation_id`, `alliance_id` - Participant filtering
- `first` - Limit (max 1000)

**Complete War Fields:**
```graphql
{
  wars(first: 10, active: true) {
    data {
      # Basic Information
      id
      date
      end_date
      reason
      war_type
      turns_left
      winner_id
      
      # Participants
      att_id
      def_id
      att_alliance_id
      def_alliance_id
      att_alliance_position
      def_alliance_position
      attacker {
        nation_name
        alliance { name }
      }
      defender {
        nation_name
        alliance { name }
      }
      
      # War Status
      ground_control
      air_superiority
      naval_blockade
      att_points
      def_points
      att_peace
      def_peace
      att_resistance
      def_resistance
      att_fortify
      def_fortify
      
      # Resource Usage
      att_gas_used
      def_gas_used
      att_mun_used
      def_mun_used
      att_alum_used
      def_alum_used
      att_steel_used
      def_steel_used
      
      # Damage & Losses
      att_infra_destroyed
      def_infra_destroyed
      att_infra_destroyed_value
      def_infra_destroyed_value
      att_money_looted
      def_money_looted
      att_soldiers_lost
      def_soldiers_lost
      att_tanks_lost
      def_tanks_lost
      att_aircraft_lost
      def_aircraft_lost
      att_ships_lost
      def_ships_lost
      
      # Attack Details
      attacks {
        id
        date
        type
        att_id
        def_id
        attacker { nation_name }
        defender { nation_name }
        victor
        success
        city_id
        infra_destroyed
        infra_destroyed_value
        improvements_lost
        money_stolen
        money_looted
        money_destroyed
        resistance_lost
        city_infra_before
        infra_destroyed_percentage
        
        # Unit Usage & Losses
        att_soldiers_used
        att_soldiers_lost
        def_soldiers_used
        def_soldiers_lost
        att_tanks_used
        att_tanks_lost
        def_tanks_used
        def_tanks_lost
        att_aircraft_used
        att_aircraft_lost
        def_aircraft_used
        def_aircraft_lost
        att_ships_used
        att_ships_lost
        def_ships_used
        def_ships_lost
        att_missiles_lost
        def_missiles_lost
        att_nukes_lost
        def_nukes_lost
        
        # Resource Usage
        att_mun_used
        def_mun_used
        att_gas_used
        def_gas_used
        military_salvage_aluminum
        military_salvage_steel
        
        # Loot Details
        coal_looted
        oil_looted
        uranium_looted
        iron_looted
        bauxite_looted
        lead_looted
        gasoline_looted
        munitions_looted
        steel_looted
        aluminum_looted
        food_looted
        
        improvements_destroyed
        cities_infra_before {
          id
          infrastructure
        }
      }
    }
  }
}
```

### Trade Data
Query market and trade information.

**Trade Prices:**
```graphql
{
  tradeprices(first: 30) {
    data {
      date
      coal
      oil
      uranium
      iron
      bauxite
      lead
      gasoline
      munitions
      steel
      aluminum
      food
      credits
    }
  }
}
```

**Individual Trades:**
```graphql
{
  trades(first: 50, accepted: false) {
    data {
      id
      type
      offer_resource
      offer_amount
      price
      buy_or_sell
      sender { nation_name }
      receiver { nation_name }
    }
  }
}
```

### Banking
Query bank transactions and transfers.

```graphql
{
  bankrecs(first: 50) {
    data {
      id
      date
      sender { nation_name }
      receiver { nation_name }
      banker { nation_name }
      note
      money
      coal
      oil
      # ... other resources
    }
  }
}
```

## Mutations (Write Operations)

**What are Mutations?**
Mutations are special GraphQL queries that perform actions rather than just retrieving data. Start your query with `mutation` instead of `query`.

**Verified Bot Requirements:**
Most mutations require a verified bot key. Only `bankWithdraw` and `bankDeposit` mutations are currently whitelisted.

**To get a verified bot key:**
1. Join the Politics and War Discord server
2. Open a ticket to apply for verification
3. Enable "whitelisted access" on your account page: https://politicsandwar.com/account/

**Authentication Headers for Mutations:**
- `X-Bot-Key`: Your verified bot key
- `X-Api-Key`: API key of the account performing the action

### Banking Operations
```graphql
mutation {
  bankDeposit(
    money: 1000000
    coal: 5000
    note: "Weekly deposit"
  ) {
    id
    date
    money
    coal
  }
}

mutation {
  bankWithdraw(
    receiver: 123456
    receiver_type: 1
    money: 500000
    note: "Grant payment"
  ) {
    id
    date
    money
  }
}
```

### Banking Operations
```graphql
mutation {
  bankDeposit(
    money: 1000000
    coal: 5000
    note: "Weekly deposit"
  ) {
    id
    date
    money
    coal
  }
}

mutation {
  bankWithdraw(
    receiver: 123456
    receiver_type: 1
    money: 500000
    note: "Grant payment"
  ) {
    id
    date
    money
  }
}
```

### Complete Mutation Operations

**Banking Mutations:**
```graphql
# Deposit resources to alliance bank
mutation {
  bankDeposit(
    money: Float = 0
    coal: Float = 0
    oil: Float = 0
    uranium: Float = 0
    iron: Float = 0
    bauxite: Float = 0
    lead: Float = 0
    gasoline: Float = 0
    munitions: Float = 0
    steel: Float = 0
    aluminum: Float = 0
    food: Float = 0
    note: String
  ) {
    id
    date
    money
    coal
    oil
    uranium
    iron
    bauxite
    lead
    gasoline
    munitions
    steel
    aluminum
    food
    note
  }
}

# Withdraw resources from alliance bank
mutation {
  bankWithdraw(
    receiver: ID!              # Receiver nation/alliance ID
    receiver_type: Int!        # 1=nation, 2=alliance
    money: Float = 0
    coal: Float = 0
    oil: Float = 0
    uranium: Float = 0
    iron: Float = 0
    bauxite: Float = 0
    lead: Float = 0
    gasoline: Float = 0
    munitions: Float = 0
    steel: Float = 0
    aluminum: Float = 0
    food: Float = 0
    note: String
  ) {
    # Same return fields as bankDeposit
  }
}
```

**Treaty Management:**
```graphql
# Propose new treaty
mutation {
  proposeTreaty(
    alliance_id: ID!           # Target alliance ID
    length: Int!               # Treaty length in days
    type: String!              # Treaty type (MDP, ODP, etc.)
    url: String                # Treaty document URL
  ) {
    id
    treaty_type
    alliance1 { name }
    alliance2 { name }
    approved
  }
}

# Approve pending treaty
mutation {
  approveTreaty(id: ID!) {
    id
    approved
  }
}

# Cancel existing treaty
mutation {
  cancelTreaty(id: ID!) {
    id
  }
}
```

**Tax Management:**
```graphql
# Create new tax bracket
mutation {
  createTaxBracket(
    name: String!              # Bracket name
    money_tax_rate: Int!       # Money tax percentage
    resource_tax_rate: Int!    # Resource tax percentage
  ) {
    id
    bracket_name
    tax_rate
    resource_tax_rate
  }
}

# Edit existing tax bracket
mutation {
  editTaxBracket(
    id: Int!
    name: String
    money_tax_rate: Int
    resource_tax_rate: Int
  ) {
    id
    bracket_name
    tax_rate
    resource_tax_rate
  }
}

# Delete tax bracket
mutation {
  deleteTaxBracket(id: Int!) {
    id
  }
}

# Assign nation to tax bracket
mutation {
  assignTaxBracket(
    id: Int!                   # Tax bracket ID
    target_id: Int!            # Nation ID
  ) {
    id
    bracket_name
  }
}
```

**Alliance Position Management:**
```graphql
# Create new alliance position
mutation {
  createAlliancePosition(
    name: String!
    level: Int!                # Position level 0-9
    view_bank: Boolean = false
    withdraw_bank: Boolean = false
    change_permissions: Boolean = false
    see_spies: Boolean = false
    see_reset_timers: Boolean = false
    tax_brackets: Boolean = false
    post_announcements: Boolean = false
    manage_announcements: Boolean = false
    accept_applicants: Boolean = false
    remove_members: Boolean = false
    edit_alliance_info: Boolean = false
    manage_treaties: Boolean = false
    manage_market_share: Boolean = false
    manage_embargoes: Boolean = false
    promote_self_to_leader: Boolean = false
  ) {
    id
    name
    position_level
    permissions
  }
}

# Edit alliance position
mutation {
  editAlliancePosition(
    id: Int!
    name: String
    level: Int
    # ... all boolean permissions same as create
  ) {
    id
    name
    position_level
  }
}

# Delete alliance position
mutation {
  deleteAlliancePosition(id: Int!) {
    id
  }
}

# Assign member to position
mutation {
  assignAlliancePosition(
    id: Int!                           # Nation ID
    default_position: DefaultAlliancePosition  # Predefined position
    position_id: Int                   # Custom position ID
  ) {
    id
    name
  }
}
```

**Trade Management:**
```graphql
# Accept personal trade offer
mutation {
  acceptPersonalTrade(
    id: Int!                   # Trade ID
    offer_amount: Int          # Amount to trade
  ) {
    id
    accepted
    date_accepted
  }
}

# Decline personal trade offer
mutation {
  declinePersonalTrade(id: Int!) {
    id
  }
}
```

## Subscriptions (Real-time Updates)

**What are Subscriptions?**
Subscriptions are streams of messages containing updated models delivered via WebSocket connections. Perfect for maintaining real-time caches of game data.

**How Subscriptions Work:**
1. Make HTTP GET request to subscribe to an event channel
2. Receive a channel name in response
3. Use the channel name to connect via WebSocket with Pusher
4. Receive real-time updates (~10 seconds after changes occur)

### Subscription Setup

**Step 1: Get Channel Name**
```
GET https://api.politicsandwar.com/subscriptions/v1/subscribe/{model}/{event}?api_key=YOUR_API_KEY_HERE
```

**Available Models:**
- `alliance`, `alliance_position`, `bankrec`, `bbgame`, `bbteam`, `bounty`, `city`, `nation`, `tax_bracket`, `trade`, `treaty`, `warattack`, `war`, `treasure_trade`, `embargo`, `account`

**Available Events:**
- `create`, `update`, `delete`

**Example Response:**
```json
{"channel":"private-pnw-399c6c896174ac0b93b2e91dee90eeb4-1656957226"}
```

**Step 2: Configure Pusher WebSocket**
- **WebSocket Host**: `socket.politicsandwar.com`
- **Auth Endpoint**: `https://api.politicsandwar.com/subscriptions/v1/auth`
- **App Key**: `"a22734a47847a64386c8"`

### Event Types

**Normal Events:** `{MODEL}_{EVENT}` (e.g., `NATION_UPDATE`)
- Contains single JSON-serialized object
- Includes all non-deprecated, non-resolved fields from API v3

**Bulk Events:** `BULK_{MODEL}_{EVENT}` (e.g., `BULK_NATION_UPDATE`)  
- Contains JSON-serialized array of objects
- Used for mass updates

### Filtering Subscriptions

Add query parameters to filter which events you receive:

```
https://api.politicsandwar.com/subscriptions/v1/subscribe/nation/update?api_key=YOUR_API_KEY_HERE&alliance_id=1,2,3
```

**Available Filters:**
- `id`, `sender_id`, `sender_type`, `receiver_id`, `receiver_type`, `or_id`, `team_id`, `nation_id`, `alliance_id`, `offer_resource`, `buy_or_sell`, `war_id`, `att_alliance_id`, `def_alliance_id`

**Field Control:**
- `exclude` - Comma-separated fields to exclude from responses
- `include` - Comma-separated fields to include only (exclusive)

### Implementation Examples

**JavaScript with pusher-js:**
```javascript
import Pusher from "pusher-js";

const channelName = JSON.parse(await (await fetch(`https://api.politicsandwar.com/subscriptions/v1/subscribe/nation/update?api_key=YOUR_API_KEY_HERE`, {
    method: 'GET',
})).text()).channel;

const pusher = new Pusher("a22734a47847a64386c8", {
  wsHost: "socket.politicsandwar.com",
  disableStats: true,
  authEndpoint: "https://api.politicsandwar.com/subscriptions/v1/auth",
});

const channel = pusher.subscribe(channelName);

function handler(data) {
  // data is an array of model objects for bulk events
  // or a single object for normal events
  console.log("Received update:", data);
}

channel.bind("BULK_NATION_UPDATE", handler);
channel.bind("NATION_UPDATE", handler);
```

**Python with pnwkit-py (Recommended):**
```python
import asyncio
import pnwkit

kit = pnwkit.QueryKit("YOUR_API_KEY_HERE")

async def main():
    subscription = await kit.subscribe("nation", "update")
    async for nation in subscription:
        print(f"Nation updated: {nation.nation_name}")

asyncio.run(main())
```

**Use Cases for Subscriptions:**
- Real-time alliance member monitoring
- War tracking and alerts
- Market price notifications  
- Banking transaction logging
- Treaty status updates

**Note**: For Python, use pnwkit-py rather than implementing raw Pusher connections, as there's no proper Pusher client library for Python.

### Nested Queries
GraphQL allows deep relationship traversal:

```graphql
{
  nations(alliance_id: [1234], first: 10) {
    data {
      nation_name
      cities {
        name
        infrastructure
        oil_power
        coal_power
        nuclear_power
      }
      wars(active: true) {
        attacker { nation_name }
        defender { nation_name }
        attacks {
          type
          success
          infra_destroyed
        }
      }
      alliance {
        name
        treaties {
          treaty_type
          alliance2 { name }
        }
      }
    }
  }
}
```

### Filtering and Ordering
Most queries support extensive filtering:

```graphql
{
  nations(
    min_score: 3000
    max_score: 5000
    color: ["gray", "white"]
    active_since: "2024-01-01"
    orderBy: {column: SCORE, order: DESC}
    first: 50
  ) {
    data {
      nation_name
      score
      last_active
    }
  }
}
```

### Pagination
Handle large datasets with pagination:

```graphql
{
  wars(first: 100, page: 1) {
    paginatorInfo {
      count
      currentPage
      hasMorePages
      total
      lastPage
    }
    data {
      id
      # war fields
    }
  }
}
```

## Data Access Permissions

### Public Data
- Basic nation information (name, leader, alliance, score, cities)
- Alliance information
- War data
- Trade prices and market data
- Treaties and diplomacy

### Restricted Data (Requires Alliance Officer+ or Same Nation)
- Resource quantities (money, materials)
- Military unit counts (spies)
- Purchase history (units bought today)
- Banking details
- Tax information

### Sensitive Data (Nation Owner Only)
- Discord information
- Update timezone
- Recent purchases

## Common Use Cases

### Alliance Management Dashboard
```graphql
{
  alliances(id: [1234]) {
    data {
      name
      score
      nations(orderBy: {column: SCORE, order: DESC}) {
        nation_name
        score
        last_active
        cities
        offensive_wars_count
        defensive_wars_count
      }
      bankrecs(first: 20) {
        date
        sender { nation_name }
        receiver { nation_name }
        money
        note
      }
    }
  }
}
```

### War Tracker
```graphql
{
  wars(
    alliance_id: [1234, 5678]
    active: true
    orderBy: {column: DATE, order: DESC}
  ) {
    data {
      id
      date
      attacker { nation_name, alliance { name } }
      defender { nation_name, alliance { name } }
      turns_left
      ground_control
      air_superiority
      naval_blockade
    }
  }
}
```

### Market Analysis
```graphql
{
  top_trade_info {
    market_index
    resources(resource: [OIL, COAL, URANIUM]) {
      resource
      average_price
      best_buy_offer {
        price
        offer_amount
        sender { nation_name }
      }
      best_sell_offer {
        price
        offer_amount
        sender { nation_name }
      }
    }
  }
}
```

## Rate Limiting and Best Practices

### Rate Limit Headers
Monitor your usage with rate limit information:

```graphql
{
  me {
    requests
    max_requests
    key
    permissions {
      nation_view_resources
      alliance_view_bank
      # ... other permissions
    }
  }
}
```

### Efficient Querying
- Request only the fields you need
- Use appropriate filtering to reduce response size
- Implement pagination for large datasets
- Cache responses when possible

### Error Handling
Common GraphQL errors:
- Invalid field names
- Insufficient permissions
- Rate limit exceeded
- Malformed query syntax

## Wrapper Libraries

### Python
```bash
pip install pnwkit-py
```

```python
import pnwkit

kit = pnwkit.QueryKit("YOUR_API_KEY")
query = kit.query("nations", {"id": [123456], "first": 1}, "nation_name score")
result = query.get()
print(f"Nation: {result.nations[0].nation_name}, Score: {result.nations[0].score}")
```

### JavaScript/TypeScript
```bash
npm install pnwkit
```

```javascript
import pnwkit from 'pnwkit';

pnwkit.setKey('YOUR_API_KEY');
const nations = await pnwkit.nationQuery({id: [123456], first: 1}, 'nation_name score');
console.log(`Nation: ${nations[0].nation_name}, Score: ${nations[0].score}`);
```

### Direct HTTP Requests
```bash
curl -X POST https://api.politicsandwar.com/graphql?api_key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"query": "{ nations(id: [123456], first: 1) { data { nation_name score } } }"}'
```

## Resources

- **GraphQL Playground**: Test queries interactively
- **Politics & Development Discord**: Community support
- **Official Documentation**: Available in playground
- **Wrapper Library Docs**: GitHub repositories for each language

## Important Notes & Restrictions

### Automation Policy
**CRITICAL**: Use of the API to fully automate gameplay is **NOT ALLOWED** and **WILL result in punishment** from the moderation team. Actions to interact with the game should be confirmed or initiated by a user, NOT done automatically on a loop or in response to game changes.

**Allowed**: Tools that help users make decisions, display information, or assist with manual actions
**Not Allowed**: Fully automated gameplay, auto-warring, auto-trading without human confirmation

### Data Characteristics
- **Data Freshness**: Most data updates within ~10 seconds of game changes
- **Historical Data**: Wars and bank records limited to last 14 days  
- **Number Format**: Inconsistent (integers, floats, or strings)
- **Property Names**: All lowercase
- **Boolean Values**: Given as 1 or 0
- **Maximum Items**: 500-1000 per query depending on endpoint

### Permission System
**Public Data:**
- Basic nation information (name, leader, alliance, score, cities)
- Alliance information, war data, trade prices, treaties

**Restricted Data (Requires Alliance Officer+ or Same Nation):**
- Resource quantities (money, materials)
- Military unit counts (spies)
- Purchase history, banking details, tax information

**Sensitive Data (Nation Owner Only):**
- Discord information, update timezone, recent purchases

### Rate Limiting
Monitor your usage with:
```graphql
{
  me {
    requests
    max_requests
    key
    permissions {
      nation_view_resources
      alliance_view_bank
      # ... other permissions
    }
  }
}
```

### Best Practices
- Request only the fields you need
- Use appropriate filtering to reduce response size  
- Implement pagination for large datasets
- Cache responses when possible
- Monitor rate limits to avoid hitting daily quotas
- Handle GraphQL errors gracefully
- Use wrapper libraries when available

### Error Handling
Common GraphQL errors:
- Invalid field names
- Insufficient permissions  
- Rate limit exceeded
- Malformed query syntax
- Server connectivity issues

This API provides comprehensive access to the Politics and War game world, enabling everything from simple nation lookups to complex alliance management systems and statistical analysis tools.
