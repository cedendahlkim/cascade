# Task: gen-strv-anagram-3072 | Score: 100% | 2026-02-14T13:40:32.669397

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')