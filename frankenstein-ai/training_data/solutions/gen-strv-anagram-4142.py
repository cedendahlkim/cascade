# Task: gen-strv-anagram-4142 | Score: 100% | 2026-02-13T20:50:25.899374

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')