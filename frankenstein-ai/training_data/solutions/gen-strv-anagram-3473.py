# Task: gen-strv-anagram-3473 | Score: 100% | 2026-02-13T09:51:15.670723

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')