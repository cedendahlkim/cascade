# Task: gen-strv-anagram-6820 | Score: 100% | 2026-02-14T12:48:38.529341

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')