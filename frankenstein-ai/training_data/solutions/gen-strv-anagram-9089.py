# Task: gen-strv-anagram-9089 | Score: 100% | 2026-02-13T16:47:53.959512

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')