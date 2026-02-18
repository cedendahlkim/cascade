# Task: gen-strv-anagram-3420 | Score: 100% | 2026-02-17T20:14:20.115937

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')