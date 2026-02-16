# Task: gen-strv-anagram-9518 | Score: 100% | 2026-02-13T21:49:33.369964

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')