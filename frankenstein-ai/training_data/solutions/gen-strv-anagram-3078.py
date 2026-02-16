# Task: gen-strv-anagram-3078 | Score: 100% | 2026-02-13T18:57:54.092771

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')