# Search Pattern Test - Start of Word Matching

## Regex Pattern Used

```javascript
const searchRegex = new RegExp(`(^|\\s)${search}`, "i");
```

**Explanation:**

- `(^|\\s)` = Start of string `^` OR whitespace `\\s`
- `${search}` = Your search term
- `i` = Case insensitive

## Test Cases

### Location: "Kadawatha Junction"

| Search Term  | Pattern Test | Matches?       | Why    |
| ------------ | ------------ | -------------- | ------ | ----------------------------------------- |
| `"kad"`      | `/(^         | \s)kad/i`      | ✅ YES | Matches start of "Kadawatha"              |
| `"Kad"`      | `/(^         | \s)Kad/i`      | ✅ YES | Case insensitive                          |
| `"KAD"`      | `/(^         | \s)KAD/i`      | ✅ YES | Case insensitive                          |
| `"daw"`      | `/(^         | \s)daw/i`      | ❌ NO  | "daw" is in middle of "Kadawatha"         |
| `"jun"`      | `/(^         | \s)jun/i`      | ✅ YES | Matches start of "Junction" (after space) |
| `"Junction"` | `/(^         | \s)Junction/i` | ✅ YES | Full word match                           |
| `"tion"`     | `/(^         | \s)tion/i`     | ❌ NO  | End of "Junction"                         |

### Crew Name: "John Doe"

| Search Term | Matches? | Why                          |
| ----------- | -------- | ---------------------------- |
| `"joh"`     | ✅ YES   | Start of "John"              |
| `"John"`    | ✅ YES   | Full first name              |
| `"doe"`     | ✅ YES   | Start of "Doe" (after space) |
| `"Doe"`     | ✅ YES   | Case insensitive             |
| `"hn"`      | ❌ NO    | Middle of "John"             |
| `"oe"`      | ❌ NO    | Middle of "Doe"              |

### Vehicle Plate: "ABC-1234"

| Search Term | Matches? | Why                               |
| ----------- | -------- | --------------------------------- |
| `"abc"`     | ✅ YES   | Start of plate                    |
| `"ABC"`     | ✅ YES   | Case insensitive                  |
| `"BC"`      | ❌ NO    | Middle of "ABC"                   |
| `"1234"`    | ❌ NO    | After hyphen (no space before it) |

**Note:** For hyphenated values like "ABC-1234", only the first part matches because there's no whitespace before "1234". If you want to match after hyphens too, we'd need to change the pattern to `(^|\\s|-)`.

### Address: "123 Main Street"

| Search Term | Matches? | Why                             |
| ----------- | -------- | ------------------------------- |
| `"123"`     | ✅ YES   | Start of address                |
| `"main"`    | ✅ YES   | Start of "Main" (after space)   |
| `"street"`  | ✅ YES   | Start of "Street" (after space) |
| `"ain"`     | ❌ NO    | Middle of "Main"                |
| `"reet"`    | ❌ NO    | Middle of "Street"              |

### Incident ID: "INC-20251023-ABC12"

| Search Term | Matches? | Why                     |
| ----------- | -------- | ----------------------- |
| `"INC"`     | ✅ YES   | Start of ID             |
| `"inc"`     | ✅ YES   | Case insensitive        |
| `"NC"`      | ❌ NO    | Middle of "INC"         |
| `"202"`     | ❌ NO    | After hyphen (no space) |
| `"ABC"`     | ❌ NO    | After hyphen (no space) |

### Assignment ID: "ASG-20251023-DGL05"

| Search Term | Matches? | Why                     |
| ----------- | -------- | ----------------------- |
| `"ASG"`     | ✅ YES   | Start of ID             |
| `"asg"`     | ✅ YES   | Case insensitive        |
| `"SG"`      | ❌ NO    | Middle of "ASG"         |
| `"DGL"`     | ❌ NO    | After hyphen (no space) |

## How It Works

### Pattern Breakdown

```javascript
const text = "Kadawatha Junction";
const search = "jun";
const regex = new RegExp(`(^|\\s)${search}`, "i");

// Becomes: /(^|\s)jun/i

// This matches:
// - ^ = Start of string
// - \s = Any whitespace character
// Then followed by "jun" (case insensitive)
```

### Visual Example

```
Text: "Kadawatha Junction"
       ^         ^
       |         |
       |         Match here with "jun" ✅
       |
       Match here with "kad" ✅

Text: "Kadawatha Junction"
          ^    ^
          |    |
          "daw" here? NO ❌ (not at start or after space)
          "tion" here? NO ❌ (not at start or after space)
```

## Implementation in Code

### Backend (assignmentController.js)

```javascript
// Post-population search filtering
if (search) {
  // Match start of any word: (^|\\s) means start of string OR after whitespace
  const searchRegex = new RegExp(`(^|\\s)${search}`, "i");

  assignments = assignments.filter((assignment) => {
    // Test each field
    if (searchRegex.test(assignment.assignmentId)) return true;
    if (searchRegex.test(incident.location.address)) return true;
    if (searchRegex.test(incident.location.city)) return true;
    // ... etc
    return false;
  });
}
```

## Benefits

1. ✅ **User-friendly:** Matches how users think (start of words)
2. ✅ **Intuitive:** "jun" finds "Junction" naturally
3. ✅ **Case-insensitive:** "KAD" = "kad" = "Kad"
4. ✅ **Multi-word support:** Works with spaces between words
5. ✅ **Prevents false positives:** "daw" doesn't match "Kadawatha"

## Limitations

1. ⚠️ **Hyphenated words:** "ABC-1234" - only "ABC" part is searchable
2. ⚠️ **Special characters:** "St.John" - period doesn't count as word boundary
3. ⚠️ **Numbers:** In IDs like "ASG-20251023", only "ASG" part is searchable

### If You Want to Include Hyphens

Change pattern to:

```javascript
const searchRegex = new RegExp(`(^|\\s|-)${search}`, "i");
//                                        ^ Added hyphen
```

Then "1234" would match "ABC-1234" ✅

## Testing

### Manual Test in Browser Console

```javascript
// Test the pattern
const testMatch = (text, search) => {
  const regex = new RegExp(`(^|\\s)${search}`, "i");
  return regex.test(text);
};

// Your example
console.log(testMatch("Kadawatha Junction", "kad")); // true ✅
console.log(testMatch("Kadawatha Junction", "daw")); // false ❌
console.log(testMatch("Kadawatha Junction", "jun")); // true ✅
```

### Test Cases for Backend

```javascript
// Location tests
testMatch("Kadawatha Junction", "kad") === true;
testMatch("Kadawatha Junction", "daw") === false;
testMatch("Kadawatha Junction", "jun") === true;

// Name tests
testMatch("John Doe", "joh") === true;
testMatch("John Doe", "hn") === false;
testMatch("John Doe", "doe") === true;

// Address tests
testMatch("123 Main Street", "123") === true;
testMatch("123 Main Street", "main") === true;
testMatch("123 Main Street", "street") === true;
testMatch("123 Main Street", "ain") === false;
```

## Summary

**Pattern:** `/(^|\\s)${search}/i`

**Matches:**

- ✅ Start of entire string
- ✅ After any whitespace (space, tab, newline)
- ✅ Case-insensitive

**Does NOT Match:**

- ❌ Middle of words
- ❌ End of words
- ❌ After hyphens/special characters (unless modified)

**Perfect for your use case!** 🎯
