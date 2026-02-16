# Task: gen-strv-anagram-4751 | Score: 100% | 2026-02-14T13:26:03.960282

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')