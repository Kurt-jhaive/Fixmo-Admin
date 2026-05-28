# Understanding Gemini System Instructions

This document explains how the system instructions work and how to customize them for your needs.

## What Are System Instructions?

System instructions are the "personality" and "knowledge base" you give to Gemini. They tell the AI:
- What role it should play
- What it knows about your system
- How to behave and respond
- What constraints to follow

Think of it like writing a job description for an employee.

## Your Chatbot's System Instructions

Your chatbot is initialized with detailed instructions about:

1. **Role Definition**
   - Acts as an admin assistant for FixMo platform
   - Helps with data inquiries and reporting
   - Does NOT modify data (read-only access)

2. **API Knowledge**
   - Complete list of available endpoints
   - Query parameters and filters
   - Response data structures

3. **Business Logic**
   - Admin workflows (user verification, provider approval)
   - Common reporting needs
   - Performance metrics

4. **Response Guidelines**
   - Use clear, tabular formats for lists
   - Provide business insights, not raw data
   - Use emojis for friendliness
   - Support multiple languages

## Flow Diagram: How System Instructions Work

```
┌─────────────────────────────────────────┐
│  System Instructions (Fixed Context)    │
│  ├─ Role: Admin Assistant              │
│  ├─ APIs: List of endpoints            │
│  ├─ Rules: What to do/not do           │
│  └─ Format: How to respond             │
└─────────────────────────────────────────┘
                    ↓
         (Sent once per session)
                    ↓
┌─────────────────────────────────────────┐
│  Gemini Model                           │
│  (Understands instructions)             │
└─────────────────────────────────────────┘
                    ↓
        (Admin sends question)
                    ↓
┌─────────────────────────────────────────┐
│  Gemini processes:                      │
│  1. What does admin want?               │
│  2. Which API endpoints apply?          │
│  3. What's the best response format?    │
└─────────────────────────────────────────┘
                    ↓
          (Formulated response)
                    ↓
┌─────────────────────────────────────────┐
│  Return: Human-friendly answer          │
│  ├─ Summary with key metrics            │
│  ├─ Suggested next questions            │
│  └─ Appropriate language                │
└─────────────────────────────────────────┘
```

## Key Sections of Your Instructions

### 1. API Endpoints Section

```
- GET /api/admin/dashboard - Platform overview and statistics
- GET /api/admin/users - List all users with filtering
- GET /api/admin/providers - List all service providers
- GET /api/appointments/ - Get all appointments with filtering
- GET /api/ratings/provider/:providerId - Get provider ratings
```

**Purpose:** Gemini learns what data is available

### 2. Query Parameters Section

```
For appointments: page, limit, status, provider_id, customer_id, from_date, to_date
For users: page, limit, search, verified_only, activated_only
For providers: page, limit, search, verified_only
```

**Purpose:** Gemini knows how to filter data appropriately

### 3. Response Formatting Guidelines

```
- Present data in tabular format
- Provide summaries with key statistics
- Use emojis for friendliness
- Highlight important metrics
```

**Purpose:** Responses are readable and useful

### 4. Common Query Examples

```
Admin asks: "Ilan yung hindi pa approve sa site?"
Gemini should: Query users with verified_only=false
Then: Count and summarize unverified users
```

**Purpose:** Gemini learns common workflow patterns

## Customizing System Instructions

### Scenario 1: Add New API Endpoints

If you add new backend endpoints, update the instructions:

```ts
// In gemini-system-instructions.ts
export const GEMINI_SYSTEM_INSTRUCTIONS = `
  ...
  ## Your New Endpoints
  
  - GET /api/admin/payments - Payment and transaction history
    Query params: from_date, to_date, status, amount_min, amount_max
    Returns: { transaction_id, amount, status, user_id, date }
  
  - GET /api/admin/reports - Generate admin reports
    Query params: type (daily/weekly/monthly), date
    Returns: Comprehensive platform report
  ...
`;
```

### Scenario 2: Change Business Rules

If your workflows change, update the rules:

```ts
// Example: If you want chatbot to help with data modification
5. **Data Modification Rules**:
   - Can deactivate users when admin explicitly asks
   - Cannot delete data (only marking as inactive)
   - Always ask for confirmation before modifying
   - Log all modifications for audit trail
```

### Scenario 3: Add Language Support

To support a new language:

```ts
8. **Language Support**:
   - English
   - Filipino (Tagalog)  
   - Spanish
   - German
   - Respond in admin's language
```

### Scenario 4: Adjust Response Style

If you want different tone:

```ts
4. **Response Formatting**:
   - Be formal and professional (remove emojis)
   - Use formal business language
   - No casual expressions
   - Include footnotes with data sources
```

## How to Modify Instructions

1. **Open the file:**
   ```
   src/lib/gemini-system-instructions.ts
   ```

2. **Find the section to modify:**
   Look for clear section headers like `## API Endpoints`, `## Business Logic`

3. **Make your changes:**
   Update the text within the backticks

4. **Test immediately:**
   Changes take effect on next chat message (no restart needed)

5. **Iterate based on results:**
   Ask the chatbot test questions to see if behavior changed

## Testing Your Instructions

### Test 1: Verify Role Understanding
```
Ask: "What can you help me with?"
Expected: Should mention data inquiries, reporting, user management, etc.
```

### Test 2: Verify Endpoint Knowledge
```
Ask: "What information can you retrieve?"
Expected: Should list major endpoint categories
```

### Test 3: Verify Constraints
```
Ask: "Can you delete a user?"
Expected: Should explain it only fetches data, cannot modify
```

### Test 4: Verify Language Support
```
Ask in Filipino: "Ilan ang new providers ngayong buwan?"
Expected: Response in Filipino with actual data summary
```

## Common Customization Needs

| Need | Change | File |
|------|--------|------|
| Support new language | Add language to section 8 | gemini-system-instructions.ts |
| Allow data modifications | Update rules in section 5 | gemini-system-instructions.ts |
| Add new endpoints | Update API Endpoints section | gemini-system-instructions.ts |
| Change response tone | Modify section 4 | gemini-system-instructions.ts |
| Add business rules | Add to Common Queries section | gemini-system-instructions.ts |

## Advanced: Using Context Stack

The system maintains a context stack for multi-turn conversations:

```
Turn 1:
Admin: "How many pending approvals?"
System: Uses general knowledge to query unverified users and providers

Turn 2:
Admin: "Tell me more about the users"
System: Uses PREVIOUS context + new instructions to filter users subset

Turn 3:
Admin: "Any from Manila?"
System: Uses context from Turn 1 & 2 + location filter
```

This means Gemini remembers conversation context across multiple exchanges!

## Pro Tips

1. **Be Specific:** Detailed instructions → Better responses
2. **Use Examples:** Real query examples teach Gemini better than abstract rules
3. **Test Changes:** After modifying, ask 5-10 test queries to verify
4. **Evolve Gradually:** Make small changes and test
5. **Document Changes:** Keep notes on what you modified and why

## System Instruction Lifecycle

```
Initial Setup
    ↓
Deploy with Basic Instructions
    ↓
Gather Admin Feedback
    ↓
Identify Common Questions
    ↓
Update Instructions with Examples
    ↓
Re-test and Iterate
    ↓
Optimize Over Time
```

---

## Related Files

- **System Instructions:** [`src/lib/gemini-system-instructions.ts`](src/lib/gemini-system-instructions.ts)
- **API Docs:** [`API_DOCUMENTATION_CONTROLLER_BASED.md`](API_DOCUMENTATION_CONTROLLER_BASED.md)
- **Examples:** [`GEMINI_CHATBOT_EXAMPLES.md`](GEMINI_CHATBOT_EXAMPLES.md)

---

**Understanding:** ⭐⭐⭐⭐⭐ Expert guidance on customization
