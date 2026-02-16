# Task: gen-strv-anagram-1726 | Score: 100% | 2026-02-13T13:46:51.639325

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')