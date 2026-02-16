# Task: gen-strv-anagram-8803 | Score: 100% | 2026-02-15T08:05:42.708474

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')