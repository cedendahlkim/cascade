# Task: gen-strv-anagram-5237 | Score: 100% | 2026-02-13T20:50:32.577450

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')