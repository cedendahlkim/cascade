# Task: gen-strv-anagram-6299 | Score: 100% | 2026-02-15T13:01:12.955394

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')