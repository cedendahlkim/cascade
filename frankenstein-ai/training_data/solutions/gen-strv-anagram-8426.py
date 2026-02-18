# Task: gen-strv-anagram-8426 | Score: 100% | 2026-02-17T20:14:10.526690

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')