# Task: gen-strv-anagram-8387 | Score: 100% | 2026-02-15T12:03:39.068060

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')