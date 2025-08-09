# 📄 windsurf-rules.md

**Windsurf Rule Set: TypeScript + React Best Practices**  
_Last Updated: 2025-08-05_

---

## 🚀 Overview

This ruleset defines enforced conventions and best practices for building modern TypeScript applications using React. These rules help ensure:

- Code readability and maintainability
- Consistency across components and modules
- Alignment with industry best practices
- Compatibility with LLM-generated suggestions

---

## 📦 File & Folder Structure

✅ **Rules**

- Group related components in feature-based folders (e.g. `features/Todo`, `components/ui`, `hooks/`).
- Always co-locate `*.test.tsx` and `*.stories.tsx` with component files.
- Use kebab-case for folder names: `user-profile`, `dashboard-widgets`.
- Use PascalCase for component files: `UserProfile.tsx`.

🚫 **Anti-patterns**

- Avoid deeply nested folder structures beyond 3 levels.
- Do not keep multiple components in a single `.tsx` file.

---

## 🔠 Naming Conventions

✅ **Rules**

- Components: `PascalCase`
- Hooks: `useCamelCase`
- Props/interfaces: `PascalCase` (`UserProfileProps`)
- Functions & variables: `camelCase`
- Enums: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

🚫 **Anti-patterns**

- Avoid generic names like `Component1`, `data`, `temp`.
- Never use abbreviations unless widely accepted (`id`, `url`, `API`).

---

## ⚛️ React Best Practices

✅ **Rules**

- Always type props using `interface` or `type`.
- Use functional components with arrow functions.
- Use `React.FC` sparingly – prefer explicit typing for props.
- Keep components pure and minimal.
- Prefer composition over inheritance.
- Use `useEffect` with proper dependency arrays.
- Use `useCallback`/`useMemo` to avoid unnecessary re-renders.

🚫 **Anti-patterns**

- Do not use class components.
- Avoid side effects inside render.
- Do not mutate props or state directly.

---

## 🧪 Testing

✅ **Rules**

- Write unit tests using [Vitest](https://vitest.dev/) or [Jest](https://jestjs.io/).
- Aim for 80%+ code coverage for features.
- Co-locate tests with components.
- Use testing-library/react for DOM testing.
- Mock external API calls and services.

🚫 **Anti-patterns**

- Avoid snapshot tests for components with complex UI.
- Never test implementation details (test behavior).

---

## 🧾 Types & Interfaces

✅ **Rules**

- Prefer `type` for unions and `interface` for objects.
- Use optional chaining and nullish coalescing.
- Strictly avoid `any`; use `unknown` if type is truly dynamic.
- Use generics for reusable utility functions and hooks.

🚫 **Anti-patterns**

- Avoid mixing `type` and `interface` in the same structure.
- Never disable TypeScript checks (`// @ts-ignore`) unless documented.

---

## 🎨 Styling

✅ **Rules**

- Prefer Tailwind CSS or CSS Modules.
- Use semantic class naming.
- Organize utility classes logically (`p-4 bg-white shadow-md`).

🚫 **Anti-patterns**

- Avoid inline styles unless dynamic or conditional.
- Do not mix multiple styling systems in the same project.

---

## 🧩 Component Design

✅ **Rules**

- Use presentational + container component separation when needed.
- Keep components < 200 lines (split logic or UI as needed).
- Use `children` prop for layout wrappers.
- Use controlled components for form inputs.

🚫 **Anti-patterns**

- Avoid props drilling – use context or state management when needed.
- Do not overload components with both logic and presentation.

---

## ⚙️ State Management

✅ **Rules**

- Use `useState` for local state.
- Use `useReducer` for complex local state logic.
- Use React Context for global state or lift state up.
- Consider Zustand, Redux Toolkit, or Jotai for larger apps.

🚫 **Anti-patterns**

- Avoid overusing context for high-frequency updates.
- Don’t keep unrelated states in the same provider.

---

## 🌐 API Integration

✅ **Rules**

- Use typed API clients (e.g., Axios with response/request types).
- Create dedicated API service modules (`api/user.ts`).
- Prefer SWR or React Query for data fetching and caching.
- Always validate API responses with Zod or similar.

🚫 **Anti-patterns**

- Avoid fetching data directly inside components (except via hooks).
- Never rely on untyped API responses.

---

## 🔍 Linting & Formatting

✅ **Rules**

- Use `eslint` with `eslint-config-airbnb` or `typescript-eslint`.
- Use `prettier` for formatting, integrated with ESLint.
- Enable formatting on save in your editor.
- Include `.eslintrc`, `.prettierrc`, and `.editorconfig` in the repo.

🚫 **Anti-patterns**

- Avoid committing code with linting or type errors.
- Never disable ESLint rules without justification.

---

## 🔐 Security & Performance

✅ **Rules**

- Sanitize user input before rendering or sending to APIs.
- Always use `key` when mapping React elements.
- Lazy load heavy components via `React.lazy` and `Suspense`.
- Optimize images and use next-gen formats.

🚫 **Anti-patterns**

- Avoid inline event handlers for complex logic.
- Don’t hardcode secrets in code; use environment variables.

---

## 📚 Documentation

✅ **Rules**

- Write clear JSDoc or TSDoc for exported functions and hooks.
- Document API methods and interfaces.
- Maintain a `README.md` in each major folder with purpose and usage.

🚫 **Anti-patterns**

- Don’t rely only on code comments – explain architecture and usage.

---

## 🧠 LLM Code Suggestions

✅ **Rules**

- Always validate LLM-generated code with linter and type checks.
- Refactor generated code for readability and maintainability.
- Use LLMs for boilerplate, not core business logic.
- Cross-check for outdated patterns or deprecated APIs.

🚫 **Anti-patterns**

- Don’t copy-paste LLM code without understanding it.
- Never bypass validations just to make LLM code “work.”

---

## ✅ Checklist Before PR

- [ ] Lint and format pass (`npm run lint && npm run format`)
- [ ] All tests pass locally
- [ ] TypeScript has no errors (`tsc --noEmit`)
- [ ] PR description is clear and links to relevant issue/task
- [ ] Code reviewed by at least one team member
- [ ] Documentation updated (if needed)

---

## 📎 Appendix

**Recommended Tools:**

- ESLint + Prettier
- React Testing Library + Vitest
- React Query / SWR
- Zod / Yup for schema validation
- Zustand / Redux Toolkit for state management
- Tailwind CSS for styling