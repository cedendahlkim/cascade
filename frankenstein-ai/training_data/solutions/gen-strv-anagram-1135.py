# Task: gen-strv-anagram-1135 | Score: 100% | 2026-02-13T19:05:34.633782

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')