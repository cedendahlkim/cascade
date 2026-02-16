# Task: gen-strv-anagram-6358 | Score: 100% | 2026-02-14T13:12:16.078427

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')