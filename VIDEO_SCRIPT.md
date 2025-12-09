# Video Script: Private Lottery FHEVM Example

## 60-Second Demonstration

### Scene 1: Introduction (0-10 seconds)

**Setting**: Show the GitHub repository on screen with clear title "Private Lottery - FHEVM Example"

**Visuals**:
- Repository structure displayed
- Key files highlighted (PrivateLottery.sol, package.json, README.md)

### Scene 2: Problem Statement (10-20 seconds)

**Setting**: Show traditional lottery contract code with exposed data

**Visuals**:
- Display simple Solidity contract with unencrypted numbers
- Highlight vulnerability: "uint256 _number" exposed on-chain
- Show message: "Anyone can see all participant entries!"

### Scene 3: Solution - FHEVM Implementation (20-35 seconds)

**Setting**: Show Private Lottery contract code

**Visuals**:
- Highlight key line: "euint32 encryptedNumber"
- Show FHE permission pattern: "FHE.allowThis()" and "FHE.allow()"
- Animate input proof validation
- Display message: "Encrypted on-chain, only authorized parties can read"

### Scene 4: Live Test Execution (35-50 seconds)

**Setting**: Terminal showing test run

**Visuals**:
- Run: `npm run test`
- Show test output with passing checks (✅)
- Highlight test categories:
  - Deployment tests
  - Entry submission tests (with encrypted data)
  - Winner drawing tests
  - Permission enforcement tests
- Show message: "40+ comprehensive test cases demonstrating all FHE patterns"

### Scene 5: Key Features Summary (50-60 seconds)

**Setting**: Show project structure with highlights

**Visuals**:
- Display feature checklist:
  - ✅ Encrypted State Storage
  - ✅ Access Control Patterns
  - ✅ Input Proof Validation
  - ✅ Multi-Round Architecture
  - ✅ Comprehensive Documentation
- Show: "Production-ready FHEVM example for Zama Bounty Program"
- End with GitHub star icon

---

## Visual Elements to Include

1. **Code Snippets**:
   - Encrypted data storage example
   - Permission grant pattern
   - Test execution output

2. **Text Overlays**:
   - Feature titles
   - Key concepts
   - Statistics (40+ tests, 270 lines, etc.)

3. **Animations**:
   - Encrypted value transformation
   - Data flow through contract
   - Test progress indicators

4. **Graphics**:
   - FHEVM logo
   - Zama branding
   - Lock icons for encryption
   - Checkmarks for success

---

## Technical Setup for Recording

### Tools Recommended
- OBS Studio or screen recording software
- Zoom or similar for webcam overlay (optional)
- Audio: Clear microphone, background noise minimal
- Resolution: 1080p or higher

### Terminal Setup
- Font size: Large (18pt+) for readability
- Theme: Dark background for visibility
- Terminal width: Show complete code lines
- Use: `npm run test` for demo

### Code Display
- Use VS Code or similar with syntax highlighting
- Consider using CodeSnap or similar for code screenshots
- Zoom: 120-150% for comfortable reading

---

## Delivery Requirements

- Duration: Exactly 60 seconds
- Format: MP4 or similar
- Audio: Clear voice narration (English, native or clear accent)
- Quality: Minimum 1080p, preferably 4K
- Subtitles: Recommended for accessibility
- Watermark: Optional GitHub/personal branding

---

## Key Talking Points to Cover

1. Privacy problem in traditional smart contracts
2. FHEVM solution with encrypted state
3. FHE permission model and input proofs
4. Real implementation with comprehensive tests
5. Production-ready example for developers
6. Call to action: Try the code, contribute, learn FHE

