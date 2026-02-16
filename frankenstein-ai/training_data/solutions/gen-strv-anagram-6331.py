# Task: gen-strv-anagram-6331 | Score: 100% | 2026-02-13T13:47:33.646547

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')