# Task: gen-strv-anagram-1645 | Score: 100% | 2026-02-15T08:47:25.492323

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')