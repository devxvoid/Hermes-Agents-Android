# Final Professional Prompt — Convert the Current App into a Native Kotlin Android App While Preserving the Existing AI Provider System

Act as a senior Android architect, Kotlin engineer, AI integration specialist, product migration expert, and UI/UX reconstruction engineer.

I want you to convert my **current app** into a **real native Kotlin Android app** while keeping it as close as possible to how it works, looks, feels, and flows right now.

This is **not** a redesign task.  
This is **not** a web-wrapper task.  
This is **not** a partial migration.  
This is a **full native Android conversion** of the existing app.

The most important requirement is that the **current AI provider system must continue to work in the Kotlin Android version**.

---

# 1. Core Goal

Convert the current app into a **true native Kotlin Android app** while preserving:

- the current product structure
- the current screens
- the current feature set
- the current navigation flow
- the current visual vibe
- the current interaction behavior
- the current AI provider workflow

The final app must feel **almost exactly like the current app**, but implemented natively for Android.

---

# 2. Critical AI Requirement

The **online AI model system must still work in the Kotlin Android app**.

That means the converted Android app must preserve the current provider-based flow, including:

- provider selection
- API key input
- model selection
- save configuration
- test and activate
- active model state
- provider switching
- usable inference after activation

The Kotlin Android version must support **online AI providers using API keys** exactly as the current app intends.

This feature must not become a placeholder or fake UI after conversion.

---

# 3. What Must Continue Working

## 3.1 Online AI Provider Flow
The converted Kotlin Android app must support:

- selecting a provider
- entering an API key
- securely saving the key
- selecting a model
- testing the connection
- activating the selected model
- showing which provider/model is active
- sending real requests to the provider
- receiving real responses
- handling invalid key, timeout, rate limit, and network errors properly

## 3.2 Current App Experience
Everything else should remain as close as possible to the current app, including:

- screen structure
- UI layout
- navigation
- feature behavior
- state flows
- settings logic
- design direction
- interaction hierarchy
- theming atmosphere

---

# 4. Hard Constraints

## Must Do
- rebuild the app as native Android
- use Kotlin
- use Android-native architecture
- preserve the current app experience as closely as possible
- preserve the current AI provider UX and logic
- make online AI providers work natively with API keys
- use native Android networking and storage
- provide a real production-minded implementation approach

## Must Not Do
- no TypeScript in the final app
- no JavaScript runtime for core app logic
- no Vite runtime
- no browser-based UI
- no WebView shell
- no hybrid wrapper
- no fake implementation of AI provider screens
- no UI-only conversion without real backend/provider connectivity

---

# 5. Migration Philosophy

Treat this as a **high-fidelity native reconstruction**.

Your job is to:

1. study the current app carefully
2. identify what is important about how it works now
3. preserve the current user-facing product experience
4. replace only the implementation layer
5. rebuild the app natively in Kotlin Android
6. make the AI provider system work properly in the native app

Do not loosely adapt it.
Do not redesign it into a different product.
Do a **faithful native rebuild**.

---

# 6. Preserve the Existing AI Provider Screen Logic

If the current app already includes an AI Provider screen or similar configuration flow, preserve that experience as closely as possible.

That includes the logic and UX for:

- active model status
- saved provider keys
- provider dropdown
- API key input
- model dropdown
- save action
- test and activate action
- provider state updates
- readiness feedback
- error messaging
- settings persistence

The goal is that users should recognize it as the same feature, now rebuilt natively.

---

# 7. Native Android Implementation Requirements

Rebuild the app using a professional Kotlin Android stack.

## Preferred Stack
- Kotlin
- Jetpack Compose
- Material 3 only where it supports current design fidelity
- Navigation Compose
- ViewModel
- Coroutines
- Flow / StateFlow
- DataStore for settings/config
- secure encrypted storage for API keys
- Retrofit or Ktor client for AI provider API calls
- Room if persistent local data is needed
- Coil for images
- WorkManager if background tasks are needed

Use Android-native solutions while preserving the current product behavior.

---

# 8. AI Provider Architecture Requirement

Design the converted app so the AI provider system is real, modular, and maintainable.

## Required Capabilities
The Kotlin Android app must support:

- provider abstraction
- model abstraction
- API key storage
- active provider state
- active model state
- test-and-activate workflow
- request execution
- response parsing
- error handling
- settings persistence

## Recommended Architecture
Design a clean provider layer such as:

- `AiProvider`
- `AiProviderRepository`
- `ProviderConfig`
- `ActiveModelState`
- `TestAndActivateUseCase`

Or an equivalent structure that cleanly separates:

- UI
- state
- persistence
- provider networking
- validation
- inference calls

---

# 9. Secure API Key Handling

This is required.

The Kotlin Android app must store API keys securely using Android best practices.

Use proper native approaches such as:

- Android Keystore-backed encryption
- EncryptedSharedPreferences if appropriate
- encrypted persistence abstraction
- secure access patterns from repositories/use cases

The app must not store API keys carelessly in plain text if avoidable.

---

# 10. Native Networking Requirement

The online AI provider flow must be rebuilt using native Android networking.

That includes:

- HTTPS requests
- auth header handling
- provider endpoint configuration
- model parameter passing
- response parsing
- timeout handling
- retry/error states
- activation test calls
- user-facing success/failure reporting

The converted Android app must be able to do the same provider work without relying on browser/web runtime behavior.

---

# 11. UI Fidelity Requirement

Do not redesign the current app unnecessarily.

The Kotlin Android app should preserve as closely as possible:

- current layout structure
- current screen composition
- current navigation flow
- current settings hierarchy
- current theming mood
- current component relationships
- current interaction rhythm

If the current app has a distinct design, replicate it faithfully in Compose instead of replacing it with generic Android defaults.

---

# 12. Feature Conversion Requirement

Every current feature should be rebuilt natively and remain meaningful.

For each existing feature:

- preserve its role
- preserve its logic
- preserve its position in the app where possible
- preserve its user-facing behavior
- implement it with native Android code

Do not leave important features as placeholders.
Do not reduce working features into static mockups.

---

# 13. What Must Be Delivered

Provide a complete migration plan and implementation-ready direction for converting the current app into Kotlin Android while keeping the AI provider system working.

## Required Deliverables
1. analyze the current app structure
2. identify all important screens and features
3. define what must stay the same
4. define the native Android architecture
5. define screen-by-screen conversion
6. define feature-by-feature conversion
7. define navigation reconstruction
8. define state-management reconstruction
9. define secure API key storage design
10. define native AI provider networking design
11. define provider/model activation flow
12. define how active model state should work in Android
13. define theming/UI fidelity strategy
14. define the Android project structure
15. define what must change only for technical/native reasons

---

# 14. Output Format

Use this structure:

## 1. Current App Product Breakdown
## 2. What Must Stay the Same
## 3. Native Android Conversion Strategy
## 4. AI Provider System Preservation Plan
## 5. Secure API Key Storage Design
## 6. Native Networking and Provider Integration
## 7. Screen-by-Screen Mapping
## 8. Feature-by-Feature Mapping
## 9. Navigation Reconstruction
## 10. State and Logic Reconstruction
## 11. Theme and UI Fidelity Plan
## 12. Android Project Structure
## 13. Implementation Build Order
## 14. Necessary Native-Only Adjustments
## 15. Final Kotlin Android Migration Recommendations

---

# 15. Quality Standard

Your output must be:

- professional
- Kotlin-first
- Android-native
- highly faithful to the current app
- AI-provider-aware
- implementation-ready
- architecture-focused
- production-minded
- realistic for a real mobile app

Do not give vague migration advice.
Do not suggest wrappers.
Do not propose replacing the product with a different design.
Do not treat the AI provider flow as optional.
Do not leave the provider screen as UI-only.

Treat this as a **faithful native Android reconstruction of the current app with fully working online AI provider support**.

---

# 16. Final Instruction

I want the **current app converted into a real Kotlin Android app**.

Everything should remain **as close as possible to how it is now**, including the AI provider experience.

Keep:

- the same product
- the same screens
- the same flow
- the same vibe
- the same behavior
- the same provider setup logic

But rebuild it natively using Kotlin and Android architecture.

Most importantly, make sure the **online AI model system still works in the Kotlin Android app using API keys, provider selection, model selection, and real native activation logic**.
