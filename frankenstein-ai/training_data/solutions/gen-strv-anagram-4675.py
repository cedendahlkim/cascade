# Task: gen-strv-anagram-4675 | Score: 100% | 2026-02-15T10:28:46.266214

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')